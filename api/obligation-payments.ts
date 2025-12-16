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
            const payments = await prisma.obligationPayment.findMany();
            return res.status(200).json(payments);
        }

        if (req.method === 'POST') {
            const { obligationId, monthKey, amountPaid, datePaid } = req.body;

            const existing = await prisma.obligationPayment.findFirst({
                where: { obligationId, monthKey }
            });

            if (existing) {
                await prisma.obligationPayment.delete({ where: { id: existing.id } });
                return res.status(200).json({ deleted: true, id: existing.id });
            }

            const payment = await prisma.obligationPayment.create({
                data: {
                    obligationId,
                    monthKey,
                    amountPaid: Number(amountPaid),
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
    } catch (error: any) {
        console.error('Obligation payments API error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
