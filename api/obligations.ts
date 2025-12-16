import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from './lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const obligations = await prisma.obligation.findMany({
                include: { payments: true }
            });
            return res.status(200).json(obligations);
        }

        if (req.method === 'POST') {
            const { name, amount, currency, dueDate, category, active } = req.body;
            const obligation = await prisma.obligation.create({
                data: {
                    name,
                    amount,
                    currency: currency || 'QAR',
                    dueDate,
                    category,
                    active: active ?? true
                }
            });
            return res.status(201).json(obligation);
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Missing id parameter' });
            }
            await prisma.obligation.delete({ where: { id } });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Obligations API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
