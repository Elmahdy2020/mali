import { Expense, Income, Obligation, ObligationPayment, Budget, BudgetMap, OpeningSavings } from '../types';

const API_BASE = '/api';

// Helper for API calls
async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${url}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    return response.json();
}

// ============ EXPENSES ============
export async function fetchExpenses(): Promise<Expense[]> {
    return apiCall<Expense[]>('/expenses');
}

export async function createExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    return apiCall<Expense>('/expenses', {
        method: 'POST',
        body: JSON.stringify(expense),
    });
}

export async function deleteExpense(id: string): Promise<void> {
    await apiCall(`/expenses?id=${id}`, { method: 'DELETE' });
}

// ============ INCOMES ============
export async function fetchIncomes(): Promise<Income[]> {
    return apiCall<Income[]>('/incomes');
}

export async function createIncome(income: Omit<Income, 'id'>): Promise<Income> {
    return apiCall<Income>('/incomes', {
        method: 'POST',
        body: JSON.stringify(income),
    });
}

export async function deleteIncome(id: string): Promise<void> {
    await apiCall(`/incomes?id=${id}`, { method: 'DELETE' });
}

// ============ OBLIGATIONS ============
export async function fetchObligations(): Promise<Obligation[]> {
    return apiCall<Obligation[]>('/obligations');
}

export async function createObligation(obligation: Omit<Obligation, 'id'>): Promise<Obligation> {
    return apiCall<Obligation>('/obligations', {
        method: 'POST',
        body: JSON.stringify(obligation),
    });
}

export async function deleteObligation(id: string): Promise<void> {
    await apiCall(`/obligations?id=${id}`, { method: 'DELETE' });
}

// ============ OBLIGATION PAYMENTS ============
export async function fetchPayments(): Promise<ObligationPayment[]> {
    return apiCall<ObligationPayment[]>('/obligation-payments');
}

export async function togglePayment(payment: Omit<ObligationPayment, 'id'>): Promise<any> {
    return apiCall('/obligation-payments', {
        method: 'POST',
        body: JSON.stringify(payment),
    });
}

// ============ BUDGETS ============
export async function fetchBudgets(): Promise<BudgetMap> {
    return apiCall<BudgetMap>('/budgets');
}

export async function updateBudget(monthKey: string, budget: Budget): Promise<void> {
    await apiCall('/budgets', {
        method: 'POST',
        body: JSON.stringify({
            monthKey,
            limit: budget.limit,
            currency: budget.currency,
            categoryLimits: budget.categoryLimits,
            alertThresholds: budget.alertThresholds,
        }),
    });
}

// ============ SAVINGS ============
export async function fetchSavings(): Promise<OpeningSavings | null> {
    return apiCall<OpeningSavings | null>('/savings');
}

export async function updateSavings(savings: OpeningSavings): Promise<void> {
    await apiCall('/savings', {
        method: 'POST',
        body: JSON.stringify(savings),
    });
}

// ============ SETTINGS ============
export async function fetchSettings(): Promise<{ currency: string }> {
    return apiCall<{ currency: string }>('/settings');
}

export async function updateSettings(currency: string): Promise<void> {
    await apiCall('/settings', {
        method: 'POST',
        body: JSON.stringify({ currency }),
    });
}
