import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from './lib/prisma';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Get the most recent opening savings (latest year)
            const savings = await prisma.openingSavings.findFirst({
                orderBy: { year: 'desc' }
            });
            return res.status(200).json(savings);
        }

        if (req.method === 'POST') {
            const { year, cashUSD, usdToQarRate, goldGrams, goldPricePerGramQAR, totalOpeningQAR } = req.body;

            const savings = await prisma.openingSavings.upsert({
                where: { year },
                update: {
                    cashUSD,
                    usdToQarRate,
                    goldGrams,
                    goldPricePerGramQAR,
                    totalOpeningQAR
                },
                create: {
                    year,
                    cashUSD,
                    usdToQarRate,
                    goldGrams,
                    goldPricePerGramQAR,
                    totalOpeningQAR
                }
            });
            return res.status(200).json(savings);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Savings API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
