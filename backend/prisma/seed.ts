import 'dotenv/config'; // Ensures .env is loaded first
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // Clean up database
    await prisma.adjustment.deleteMany({});
    await prisma.issue.deleteMany({});
    await prisma.saleLine.deleteMany({});
    await prisma.sale.deleteMany({});
    await prisma.batch.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.setting.deleteMany({});
    console.log('Database cleaned.');

    // 1. Seed Users
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('AdminPass123!', saltRounds);
    const cashierPassword = await bcrypt.hash('Cash1Pass!', saltRounds);

    await prisma.user.createMany({
      data: [
        {
          username: 'admin',
          password_hash: adminPassword,
          role: 'Admin',
          full_name: 'Admin User',
        },
        {
          username: 'cashier1',
          password_hash: cashierPassword,
          role: 'Cashier',
          full_name: 'Cashier One',
        },
      ],
    });
    console.log('Users seeded.');

    // 2. Seed Settings
    await prisma.setting.createMany({
        data: [
          { key: 'LowStockThreshold', value: '10' },
          { key: 'NearExpiryDays', value: '90' },
        ],
    });
    console.log('Settings seeded.');

    // 3. Seed Products
    await prisma.product.createMany({
      data: [
        {
          code_type: 'GTIN',
          code_value: '99906000123456',
          name: 'Amoxicillin',
          strength: '500mg',
          form: 'Capsule',
          pack_size: 100,
          uom: 'Capsule',
          unit_price: 3.5,
          unit_cost: 2.5,
        },
        {
          code_type: 'GTIN',
          code_value: '99906000123457',
          name: 'Paracetamol',
          strength: '500mg',
          form: 'Tablet',
          pack_size: 100,
          uom: 'Tablet',
          unit_price: 2.0,
          unit_cost: 1.5,
        },
      ],
    });
    console.log('Products seeded.');

    // 4. Seed Batches
    const amoxicillin = await prisma.product.findUnique({ where: { code_value: '99906000123456' } });
    const paracetamol = await prisma.product.findUnique({ where: { code_value: '99906000123457' } });

    if (amoxicillin) {
      await prisma.batch.create({
        data: {
          product_id: amoxicillin.id,
          lot: 'L001X',
          expiry: new Date('2025-01-31'),
          qty_on_hand: 100,
          unit_cost: 2.5,
        },
      });
    }

    if (paracetamol) {
      await prisma.batch.createMany({
        data: [
          {
            product_id: paracetamol.id,
            lot: 'TBATCH1',
            expiry: new Date('2025-10-15'),
            qty_on_hand: 5, // Low stock for testing
            unit_cost: 1.5,
          },
          {
            product_id: paracetamol.id,
            lot: 'TBATCH2',
            expiry: new Date(new Date().setDate(new Date().getDate() + 30)), // Near expiry for testing
            qty_on_hand: 50,
            unit_cost: 1.5,
          },
          {
            product_id: paracetamol.id,
            lot: 'TBATCH3',
            expiry: new Date('2022-01-01'), // Expired for testing
            qty_on_hand: 20,
            unit_cost: 1.4,
          }
        ],
      });
    }
    console.log('Batches seeded.');

    console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
