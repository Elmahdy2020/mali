import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from './lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const expenses = await prisma.expense.findMany({
                orderBy: { createdAt: 'desc' }
            });
            return res.status(200).json(expenses);
        }

        if (req.method === 'POST') {
            const { amount, currency, category, date, description } = req.body;
            const expense = await prisma.expense.create({
                data: {
                    amount,
                    currency: currency || 'QAR',
                    category,
                    date,
                    description
                }
            });
            return res.status(201).json(expense);
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Missing id parameter' });
            }
            await prisma.expense.delete({ where: { id } });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Expenses API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
