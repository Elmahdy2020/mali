import React, { useState } from 'react';
import { Expense } from '../types';

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

interface ExpenseInputProps {
  onAddExpense: (expense: Expense) => void;
  currency: string;
}

export const CATEGORIES = [
  'سوبر ماركت',
  'طعام',
  'الجيم',
  'اتصالات ونت',
  'تبرع وصدقه',
  'خروجات',
  'تنقلات',
  'شوبينج',
  'أخرى'
];

export const ExpenseInput: React.FC<ExpenseInputProps> = ({ onAddExpense, currency }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('أخرى');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    const newExpense: Expense = {
      id: generateId(),
      amount: parseFloat(amount),
      currency: currency,
      category: selectedCategory,
      date: date,
      description: description || selectedCategory,
      createdAt: Date.now(),
    };
    onAddExpense(newExpense);

    // Reset form
    setAmount('');
    setDescription('');
    setSelectedCategory('أخرى');
    setDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 p-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-gradient-to-l from-indigo-600 to-blue-600 text-white py-3 px-6 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            إضافة مصروف
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto animate-slide-up">
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @keyframes slide-up {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
        `}</style>

        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">إضافة مصروف جديد</h2>
            <button
              onClick={() => setShowForm(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">المبلغ ({currency})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800 text-lg font-bold"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                required
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">التصنيف</label>
              <div className="no-scrollbar overflow-x-auto whitespace-nowrap flex gap-2 pb-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all border ${selectedCategory === cat
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">الوصف (اختياري)</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800"
                placeholder="مثال: غداء مع الأصدقاء..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">التاريخ</label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full bg-gradient-to-l from-indigo-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إضافة المصروف
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};