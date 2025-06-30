import express from 'express';
import { PrismaClient } from './generated/prisma';
import dotenv from 'dotenv';
import identify from './identify';
// import ident

dotenv.config();
const app = express();
const primsa = new PrismaClient();
const PORT = process.env.port || 3000;


app.use(express.json());

app.post('/identify', (req,res) => identify(req, res, primsa));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});