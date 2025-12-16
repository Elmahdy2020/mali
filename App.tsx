import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Expense, Budget, AlertThresholds, BudgetMap, Income, Obligation, ObligationPayment, OpeningSavings } from './types';
import { ExpenseInput } from './components/ExpenseInput';
import { BudgetCard } from './components/BudgetCard';
import { DashboardCharts } from './components/DashboardCharts';
import { ExpenseList } from './components/ExpenseList';
import { CategoryBudgetList } from './components/CategoryBudgetList';
import { SettingsModal } from './components/SettingsModal';
import { YearlyReportModal } from './components/YearlyReportModal';
import { IncomeManager } from './components/IncomeManager';
import { ObligationManager } from './components/ObligationManager';
import { SavingsManager } from './components/SavingsManager';
import * as api from './services/api';

const App: React.FC = () => {
  // --- View State ---
  type View = 'dashboard' | 'income' | 'obligations' | 'savings';
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // --- Global Settings State ---
  const [currency, setCurrency] = useState<string>('QAR');

  // --- Data States ---
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [obligationPayments, setObligationPayments] = useState<ObligationPayment[]>([]);
  const [openingSavings, setOpeningSavings] = useState<OpeningSavings | null>(null);

  const defaultBudget: Budget = {
    limit: 5000,
    currency: currency,
    categoryLimits: {},
    alertThresholds: { warning: 75, critical: 90 }
  };

  const [budgets, setBudgets] = useState<BudgetMap>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [showYearlyReport, setShowYearlyReport] = useState(false);

  // --- Load data from API on mount ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [
          expensesData,
          incomesData,
          obligationsData,
          paymentsData,
          budgetsData,
          savingsData,
          settingsData
        ] = await Promise.all([
          api.fetchExpenses(),
          api.fetchIncomes(),
          api.fetchObligations(),
          api.fetchPayments(),
          api.fetchBudgets(),
          api.fetchSavings(),
          api.fetchSettings()
        ]);

        setExpenses(expensesData);
        setIncomes(incomesData);
        setObligations(obligationsData);
        setObligationPayments(paymentsData);
        setBudgets(budgetsData);
        setOpeningSavings(savingsData);
        setCurrency(settingsData.currency);
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to localStorage if API fails
        const savedExpenses = localStorage.getItem('expenses');
        const savedIncomes = localStorage.getItem('incomes');
        const savedObligations = localStorage.getItem('obligations');
        const savedPayments = localStorage.getItem('obligation_payments');
        const savedBudgets = localStorage.getItem('monthly_budgets');
        const savedSavings = localStorage.getItem('opening_savings');
        const savedCurrency = localStorage.getItem('app_currency');

        if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
        if (savedIncomes) setIncomes(JSON.parse(savedIncomes));
        if (savedObligations) setObligations(JSON.parse(savedObligations));
        if (savedPayments) setObligationPayments(JSON.parse(savedPayments));
        if (savedBudgets) setBudgets(JSON.parse(savedBudgets));
        if (savedSavings) setOpeningSavings(JSON.parse(savedSavings));
        if (savedCurrency) setCurrency(savedCurrency);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // --- Helpers ---
  const formatMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthKey = formatMonthKey(selectedDate);

  // --- Derived Data ---
  const activeBudget = useMemo(() => {
    if (budgets[currentMonthKey]) return budgets[currentMonthKey];
    const sortedKeys = Object.keys(budgets).sort();
    const previousKeys = sortedKeys.filter(k => k < currentMonthKey);
    if (previousKeys.length > 0) return budgets[previousKeys[previousKeys.length - 1]];
    return defaultBudget;
  }, [budgets, currentMonthKey, defaultBudget]);

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(e => e.date.startsWith(currentMonthKey));
  }, [expenses, currentMonthKey]);

  const currentMonthIncomes = useMemo(() => {
    return incomes.filter(i => i.date.startsWith(currentMonthKey));
  }, [incomes, currentMonthKey]);

  const currentMonthObligations = useMemo(() => {
    return obligations.filter(o => o.dueDate && o.dueDate.startsWith(currentMonthKey));
  }, [obligations, currentMonthKey]);

  const currentMonthPayments = useMemo(() => {
    return obligationPayments.filter(p => p.monthKey === currentMonthKey || currentMonthObligations.some(o => o.id === p.obligationId));
  }, [obligationPayments, currentMonthKey, currentMonthObligations]);

  // Totals for Dashboard
  const totalSpentExpenses = currentMonthExpenses.reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = currentMonthIncomes.reduce((sum, item) => sum + item.amount, 0);
  const totalPaidObligations = currentMonthPayments
    .filter(p => currentMonthObligations.some(o => o.id === p.obligationId))
    .reduce((sum, item) => sum + item.amountPaid, 0);

  const totalCumulativeSavings = useMemo(() => {
    const allIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const allExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const allObligations = obligationPayments.reduce((sum, p) => sum + p.amountPaid, 0);
    const netOperations = allIncome - (allExpense + allObligations);
    const startBalance = openingSavings ? openingSavings.totalOpeningQAR : 0;
    return startBalance + netOperations;
  }, [incomes, expenses, obligationPayments, openingSavings]);

  const calculatedTotalBudget = useMemo(() => {
    const values = Object.values(activeBudget.categoryLimits) as number[];
    const sum = values.reduce((a, b) => a + b, 0);
    return sum > 0 ? sum : activeBudget.limit;
  }, [activeBudget]);

  const overBudgetCategories = useMemo(() => {
    const totals = currentMonthExpenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(activeBudget.categoryLimits).filter(cat => {
      const limit = activeBudget.categoryLimits[cat];
      return limit > 0 && (totals[cat] || 0) > limit;
    });
  }, [currentMonthExpenses, activeBudget]);

  // --- Handlers with API calls ---
  const handleAddExpense = useCallback(async (expense: Expense) => {
    try {
      const created = await api.createExpense({
        amount: expense.amount,
        currency: expense.currency,
        category: expense.category,
        date: expense.date,
        description: expense.description
      });
      setExpenses(prev => [created, ...prev]);
    } catch (error) {
      console.error('Error creating expense:', error);
      // Fallback: add locally
      setExpenses(prev => [expense, ...prev]);
    }
  }, []);

  const handleDeleteExpense = useCallback(async (id: string) => {
    try {
      await api.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  }, []);

  const handleAddIncome = useCallback(async (income: Income) => {
    try {
      const created = await api.createIncome({
        source: income.source,
        amount: income.amount,
        currency: income.currency,
        date: income.date,
        type: income.type,
        notes: income.notes
      });
      setIncomes(prev => [created, ...prev]);
    } catch (error) {
      console.error('Error creating income:', error);
      setIncomes(prev => [income, ...prev]);
    }
  }, []);

  const handleDeleteIncome = useCallback(async (id: string) => {
    try {
      await api.deleteIncome(id);
      setIncomes(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      console.error('Error deleting income:', error);
    }
  }, []);

  const handleAddObligation = useCallback(async (ob: Obligation) => {
    try {
      const created = await api.createObligation({
        name: ob.name,
        amount: ob.amount,
        currency: ob.currency,
        dueDate: ob.dueDate,
        category: ob.category,
        active: ob.active
      });
      setObligations(prev => [...prev, created]);
    } catch (error) {
      console.error('Error creating obligation:', error);
      setObligations(prev => [...prev, ob]);
    }
  }, []);

  const handleDeleteObligation = useCallback(async (id: string) => {
    try {
      await api.deleteObligation(id);
      setObligations(prev => prev.filter(o => o.id !== id));
      setObligationPayments(prev => prev.filter(p => p.obligationId !== id));
    } catch (error) {
      console.error('Error deleting obligation:', error);
    }
  }, []);

  const handleTogglePayment = useCallback(async (obligationId: string, amount: number) => {
    try {
      const result = await api.togglePayment({
        obligationId,
        monthKey: currentMonthKey,
        amountPaid: amount,
        datePaid: new Date().toISOString()
      });

      if (result.deleted) {
        setObligationPayments(prev => prev.filter(p => p.id !== result.id));
      } else {
        setObligationPayments(prev => [...prev, result]);
      }
    } catch (error) {
      console.error('Error toggling payment:', error);
    }
  }, [currentMonthKey]);

  const updateBudgetForMonth = useCallback(async (updater: (prevBudget: Budget) => Budget) => {
    const startingBudget = budgets[currentMonthKey] || activeBudget;
    const newBudget = updater(startingBudget);

    setBudgets(prev => ({ ...prev, [currentMonthKey]: newBudget }));

    try {
      await api.updateBudget(currentMonthKey, newBudget);
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  }, [budgets, currentMonthKey, activeBudget]);

  const handleUpdateOpeningSavings = useCallback(async (savings: OpeningSavings | null) => {
    setOpeningSavings(savings);
    if (savings) {
      try {
        await api.updateSavings(savings);
      } catch (error) {
        console.error('Error updating savings:', error);
      }
    }
  }, []);

  const handleCurrencyChange = useCallback(async (newCurrency: string) => {
    setCurrency(newCurrency);
    try {
      await api.updateSettings(newCurrency);
    } catch (error) {
      console.error('Error updating currency:', error);
    }
  }, []);

  const handleClearAll = useCallback(async () => {
    if (confirm('مسح الكل؟')) {
      setExpenses([]);
      setIncomes([]);
      setObligations([]);
      setObligationPayments([]);
      setBudgets({});
      setOpeningSavings(null);
      // Note: This doesn't clear the database - would need additional API endpoints for that
    }
  }, []);

  // --- Navigation & UI ---
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const currentMonthName = monthNames[selectedDate.getMonth()];
  const currentYear = selectedDate.getFullYear();
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const daysRemaining = Math.max(0, daysInMonth - new Date().getDate());

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">جاري تحميل بياناتك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-right font-sans" dir="rtl">
      <div className="max-w-lg mx-auto min-h-screen flex flex-col">

        {/* Header */}
        <header className="p-4 bg-white shadow-sm sticky top-0 z-40">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-l from-indigo-700 to-blue-600 flex items-center gap-1">
              <span>CashFlowy</span>
              <span className="text-xl">💸</span>
            </h1>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowYearlyReport(true)} className="text-xs bg-indigo-50 text-indigo-600 px-3 py-2 rounded-full hover:bg-indigo-100 font-bold">
                تقرير السنة
              </button>
              <button onClick={() => setShowSettings(true)} className="p-2 text-gray-500 bg-gray-50 rounded-full hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
              </button>
              <button className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-full hover:bg-red-100" onClick={handleClearAll}>
                تصفير
              </button>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-gray-100 rounded-xl p-1 mb-3">
            <button onClick={() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-2 hover:bg-white rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
            <span className="font-bold text-gray-800">{currentMonthName} {currentYear}</span>
            <button onClick={() => setSelectedDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-2 hover:bg-white rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
            <button onClick={() => setCurrentView('dashboard')} className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg whitespace-nowrap transition-all ${currentView === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}>الرئيسية</button>
            <button onClick={() => setCurrentView('income')} className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg whitespace-nowrap transition-all ${currentView === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}>الدخل</button>
            <button onClick={() => setCurrentView('obligations')} className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg whitespace-nowrap transition-all ${currentView === 'obligations' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>الالتزامات</button>
            <button onClick={() => setCurrentView('savings')} className={`flex-1 py-2 px-3 text-sm font-bold rounded-lg whitespace-nowrap transition-all ${currentView === 'savings' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500'}`}>المدخرات</button>
          </div>
        </header>

        <main className="flex-1 p-4">
          {currentView === 'dashboard' && (
            <>
              <BudgetCard
                totalIncome={totalIncome}
                totalExpenses={totalSpentExpenses}
                totalObligations={totalPaidObligations}
                budgetLimit={calculatedTotalBudget}
                currency={currency}
                overBudgetCategories={overBudgetCategories}
                selectedDate={selectedDate}
                thresholds={activeBudget.alertThresholds}
                openingSavings={openingSavings}
                totalCumulativeSavings={totalCumulativeSavings}
              />

              <DashboardCharts expenses={currentMonthExpenses} />

              <CategoryBudgetList
                expenses={currentMonthExpenses}
                categoryLimits={activeBudget.categoryLimits}
                currency={currency}
                onUpdateCategoryLimit={(c, l) => updateBudgetForMonth(prev => ({ ...prev, categoryLimits: { ...prev.categoryLimits, [c]: l } }))}
                thresholds={activeBudget.alertThresholds}
              />
              <ExpenseList expenses={currentMonthExpenses} onDelete={handleDeleteExpense} />
            </>
          )}

          {currentView === 'income' && (
            <IncomeManager
              incomes={currentMonthIncomes}
              onAddIncome={handleAddIncome}
              onDeleteIncome={handleDeleteIncome}
              currency={currency}
            />
          )}

          {currentView === 'obligations' && (
            <ObligationManager
              obligations={currentMonthObligations}
              payments={obligationPayments}
              onAddObligation={handleAddObligation}
              onTogglePayment={handleTogglePayment}
              onDeleteObligation={handleDeleteObligation}
              currency={currency}
              selectedDate={selectedDate}
            />
          )}

          {currentView === 'savings' && (
            <SavingsManager
              openingSavings={openingSavings}
              onUpdateOpeningSavings={handleUpdateOpeningSavings}
              currency={currency}
            />
          )}
        </main>

        {/* Global Floating Action Button for Expense - only show on Dashboard */}
        {currentView === 'dashboard' && (
          <ExpenseInput onAddExpense={handleAddExpense} currency={currency} />
        )}

        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          thresholds={activeBudget.alertThresholds}
          currentCurrency={currency}
          onSave={(t, newCurrency) => {
            handleCurrencyChange(newCurrency);
            updateBudgetForMonth(prev => ({ ...prev, alertThresholds: t }));
          }}
        />

        <YearlyReportModal
          isOpen={showYearlyReport}
          onClose={() => setShowYearlyReport(false)}
          expenses={expenses}
          incomes={incomes}
          obligationPayments={obligationPayments}
          budgets={budgets}
          openingSavings={openingSavings}
          currentDate={new Date()}
        />
      </div>
    </div>
  );
};
export default App;