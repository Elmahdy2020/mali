import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const incomes = await prisma.income.findMany({
                orderBy: { createdAt: 'desc' }
            });
            return res.status(200).json(incomes);
        }

        if (req.method === 'POST') {
            const { source, amount, currency, date, type, notes } = req.body;
            const income = await prisma.income.create({
                data: {
                    source,
                    amount: Number(amount),
                    currency: currency || 'QAR',
                    date,
                    type,
                    notes
                }
            });
            return res.status(201).json(income);
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Missing id parameter' });
            }
            await prisma.income.delete({ where: { id } });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Incomes API error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
