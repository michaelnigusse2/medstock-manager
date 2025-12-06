import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { signJwt, authMiddleware } from './auth';

const adapter = new PrismaBetterSqlite3({
  url: 'file:./dev.db',
});
const prisma = new PrismaClient({ adapter });
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    return res.status(401).send('Invalid username or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    return res.status(401).send('Invalid username or password');
  }

  const token = signJwt({ userId: user.id, role: user.role });
  res.json({ token });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const { userId } = (req as any).user;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      role: true,
      full_name: true,
    },
  });

  res.json(user);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
