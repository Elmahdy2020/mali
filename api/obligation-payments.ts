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
            const payments = await prisma.obligationPayment.findMany();
            return res.status(200).json(payments);
        }

        if (req.method === 'POST') {
            const { obligationId, monthKey, amountPaid, datePaid } = req.body;

            // Check if payment already exists (toggle behavior)
            const existing = await prisma.obligationPayment.findFirst({
                where: { obligationId, monthKey }
            });

            if (existing) {
                // Delete existing payment (toggle off)
                await prisma.obligationPayment.delete({ where: { id: existing.id } });
                return res.status(200).json({ deleted: true, id: existing.id });
            }

            // Create new payment
            const payment = await prisma.obligationPayment.create({
                data: {
                    obligationId,
                    monthKey,
                    amountPaid,
                    datePaid
                }
            });
            return res.status(201).json(payment);
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id || typeof id !== 'string') {
                return res.status(400).json({ error: 'Missing id parameter' });
            }
            await prisma.obligationPayment.delete({ where: { id } });
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Obligation payments API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
