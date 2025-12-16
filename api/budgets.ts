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
            const budgets = await prisma.budget.findMany();
            const budgetMap: Record<string, any> = {};
            budgets.forEach(b => {
                budgetMap[b.monthKey] = {
                    limit: b.limitAmount,
                    currency: b.currency,
                    categoryLimits: JSON.parse(b.categoryLimits),
                    alertThresholds: {
                        warning: b.warningThreshold,
                        critical: b.criticalThreshold
                    }
                };
            });
            return res.status(200).json(budgetMap);
        }

        if (req.method === 'POST') {
            const { monthKey, limit, currency, categoryLimits, alertThresholds } = req.body;

            const budget = await prisma.budget.upsert({
                where: { monthKey },
                update: {
                    limitAmount: Number(limit),
                    currency: currency || 'QAR',
                    categoryLimits: JSON.stringify(categoryLimits || {}),
                    warningThreshold: alertThresholds?.warning || 75,
                    criticalThreshold: alertThresholds?.critical || 90
                },
                create: {
                    monthKey,
                    limitAmount: Number(limit) || 5000,
                    currency: currency || 'QAR',
                    categoryLimits: JSON.stringify(categoryLimits || {}),
                    warningThreshold: alertThresholds?.warning || 75,
                    criticalThreshold: alertThresholds?.critical || 90
                }
            });
            return res.status(200).json(budget);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('Budgets API error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
