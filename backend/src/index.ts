import 'dotenv/config'; // Ensures .env is loaded first
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { signJwt, authMiddleware } from './auth';

const prisma = new PrismaClient();
const app = express();
const port = 3000;

// (The rest of the file is the same as before, but is included here for completeness)

// In-memory cache for settings
let settingsCache = new Map<string, string>();

async function loadSettings() {
  try {
    const settings = await prisma.setting.findMany();
    settingsCache = new Map(settings.map(s => [s.key, s.value]));
    console.log('Settings loaded into cache.');
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

app.use(cors());
app.use(express.json());

// Middleware for admin-only routes
const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user && user.role === 'Admin') {
    return next();
  }
  return res.status(403).json({ error: 'Forbidden: Admin access required.' });
};

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return res.status(401).send('Invalid username or password');
  }
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    return res.status(401).send('Invalid username or password');
  }
  const token = signJwt({ userId: user.id, role: user.role, username: user.username });
  res.json({ token });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = (req as any).user;
  res.json({
    id: user.userId,
    username: user.username,
    role: user.role,
    full_name: user.full_name || '',
  });
});

// --- Inventory Endpoints --- (and the rest of your API endpoints)
// (The rest of your endpoints like /api/products, /api/inventory, etc., remain unchanged)

app.get('/api/products', authMiddleware, async (req, res) => {
    try {
      const products = await prisma.product.findMany({
        orderBy: { name: 'asc' },
      });
      res.json(products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/inventory', authMiddleware, async (req, res) => {
    try {
      const lowStockThreshold = parseInt(settingsCache.get('LowStockThreshold') || '10', 10);
      const nearExpiryDays = parseInt(settingsCache.get('NearExpiryDays') || '90', 10);
      const nearExpiryDate = new Date();
      nearExpiryDate.setDate(nearExpiryDate.getDate() + nearExpiryDays);

      const products = await prisma.product.findMany({
        include: {
          batches: {
            orderBy: { expiry: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });

      const inventory = products.map(product => {
        const total_qty_on_hand = product.batches.reduce((sum, batch) => sum + batch.qty_on_hand, 0);
        const is_low_stock = total_qty_on_hand <= lowStockThreshold;

        const batchesWithStatus = product.batches.map(batch => {
          const is_expired = batch.expiry ? new Date(batch.expiry) < new Date() : false;
          const is_near_expiry = batch.expiry ? !is_expired && new Date(batch.expiry) <= nearExpiryDate : false;
          return { ...batch, is_expired, is_near_expiry };
        });

        return {
          ...product,
          batches: batchesWithStatus,
          total_qty_on_hand,
          is_low_stock,
        };
      });

      res.json(inventory);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


  app.post('/api/receive', authMiddleware, adminOnly, async (req, res) => {
    const {
      code_type, code_value, name, strength, form, pack_size, uom,
      unit_price, lot, expiry, qty, unit_cost
    } = req.body;
    const user = (req as any).user;

    if (!code_value || !name || !lot || !expiry || qty === undefined || unit_cost === undefined) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
      const newBatch = await prisma.$transaction(async (tx) => {
        let product = await tx.product.findUnique({
          where: { code_value },
        });

        if (!product) {
          product = await tx.product.create({
            data: {
              code_type: code_type || 'InternalSku', code_value, name, strength,
              form, pack_size: parseInt(pack_size, 10) || null, uom, unit_price: parseFloat(unit_price) || null, unit_cost: parseFloat(unit_cost) || null,
            },
          });
        }

        const createdBatch = await tx.batch.create({
          data: {
            product_id: product.id,
            lot,
            expiry: new Date(expiry),
            qty_on_hand: parseInt(qty, 10),
            unit_cost: parseFloat(unit_cost),
          },
        });

        await tx.adjustment.create({
            data: {
              created_by: user.username,
              product_id: product.id,
              batch_id: createdBatch.id,
              delta: createdBatch.qty_on_hand,
              reason: 'Initial stock receipt',
            },
        });

        return createdBatch;
      });

      res.status(201).json(newBatch);
    } catch (error: any) {
      console.error('Failed to receive stock:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/adjustments', authMiddleware, adminOnly, async (req, res) => {
    const { batch_id, new_qty, reason } = req.body;
    const user = (req as any).user;

    if (batch_id === undefined || new_qty === undefined || !reason) {
      return res.status(400).json({ error: 'Missing required fields: batch_id, new_qty, and reason are required.' });
    }

    const newQuantity = parseInt(new_qty, 10);
    if (isNaN(newQuantity) || newQuantity < 0) {
      return res.status(400).json({ error: 'Invalid new quantity.' });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const batch = await tx.batch.findUnique({
          where: { id: batch_id },
        });

        if (!batch) {
          throw new Error('Batch not found.');
        }

        const delta = newQuantity - batch.qty_on_hand;

        if (delta === 0) {
          return { message: 'No change in quantity.' };
        }

        const updatedBatch = await tx.batch.update({
          where: { id: batch_id },
          data: { qty_on_hand: newQuantity },
        });

        await tx.adjustment.create({
          data: {
            created_by: user.username,
            product_id: batch.product_id,
            batch_id: batch.id,
            delta,
            reason,
          },
        });

        return updatedBatch;
      });

      res.json(result);
    } catch (error: any) {
      console.error('Failed to adjust stock:', error);
      if (error.message === 'Batch not found.') {
          return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });


app.listen(port, async () => {
  await loadSettings();
  console.log(`Server is running on http://localhost:${port}`);
});
