import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const settings = await prisma.settings.findUnique({
                where: { id: 'default' }
            });
            return res.status(200).json(settings || { currency: 'QAR' });
        }

        if (req.method === 'POST') {
            const { currency } = req.body;

            const settings = await prisma.settings.upsert({
                where: { id: 'default' },
                update: { currency },
                create: { id: 'default', currency }
            });
            return res.status(200).json(settings);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Settings API error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
