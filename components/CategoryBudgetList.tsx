import React, { useState } from 'react';
import { Expense, AlertThresholds } from '../types';
import { CATEGORIES } from './ExpenseInput';

interface CategoryBudgetListProps {
  expenses: Expense[];
  categoryLimits: Record<string, number>;
  currency: string;
  onUpdateCategoryLimit: (category: string, limit: number) => void;
  thresholds: AlertThresholds;
}

export const CategoryBudgetList: React.FC<CategoryBudgetListProps> = ({ 
  expenses, 
  categoryLimits, 
  currency,
  onUpdateCategoryLimit,
  thresholds
}) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState<string>('');

  // Calculate totals per category
  const categoryTotals = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleStartEdit = (cat: string, currentLimit: number) => {
    setEditingCategory(cat);
    setTempLimit(currentLimit ? currentLimit.toString() : '');
  };

  const handleSaveEdit = (cat: string) => {
    const val = parseFloat(tempLimit);
    if (!isNaN(val) && val >= 0) {
      onUpdateCategoryLimit(cat, val);
    }
    setEditingCategory(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 px-1">ميزانيات الأقسام (شهري)</h3>
      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const spent = categoryTotals[cat] || 0;
          const limit = categoryLimits[cat] || 0;
          const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
          
          let barColor = 'bg-blue-500';
          if (percentage >= 100) barColor = 'bg-red-500';
          else if (percentage >= thresholds.critical) barColor = 'bg-orange-500';
          else if (percentage >= thresholds.warning) barColor = 'bg-yellow-400';
          
          if (limit === 0 && spent > 0) barColor = 'bg-gray-400';

          return (
            <div key={cat} className="border-b border-gray-50 last:border-0 pb-2 last:pb-0">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700">{cat}</span>
                  {limit > 0 && spent > limit && (
                     <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">تخطيت الحد</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                    {editingCategory === cat ? (
                        <div className="flex items-center gap-1">
                             <input 
                                type="number" 
                                className="w-16 border rounded px-1 py-0.5 text-xs text-left"
                                value={tempLimit}
                                autoFocus
                                onChange={(e) => setTempLimit(e.target.value)}
                                placeholder="0"
                             />
                             <button onClick={() => handleSaveEdit(cat)} className="text-green-600 text-xs font-bold">حفظ</button>
                        </div>
                    ) : (
                        <div 
                          onClick={() => handleStartEdit(cat, limit)}
                          className="text-xs text-gray-500 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors flex flex-col items-end"
                        >
                            <span className="font-semibold text-gray-900">
                                {spent.toLocaleString()} / {limit > 0 ? limit.toLocaleString() : '∞'} {currency}
                            </span>
                        </div>
                    )}
                </div>
              </div>
              
              {limit > 0 ? (
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
                    <div 
                        className={`h-1.5 rounded-full ${barColor} transition-all duration-500`} 
                        style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
              ) : (
                  spent > 0 && <div className="h-1 bg-gray-100 w-full mt-1 rounded-full overflow-hidden"><div className="h-full bg-blue-200 w-full animate-pulse"></div></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};