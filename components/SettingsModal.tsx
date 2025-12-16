import React, { useState, useEffect } from 'react';
import { AlertThresholds } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: AlertThresholds;
  onSave: (newThresholds: AlertThresholds, newCurrency: string) => void;
  currentCurrency: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, thresholds, onSave, currentCurrency }) => {
  const [warning, setWarning] = useState(thresholds.warning);
  const [critical, setCritical] = useState(thresholds.critical);
  const [currency, setCurrency] = useState(currentCurrency);

  // Sync state when prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setWarning(thresholds.warning);
      setCritical(thresholds.critical);
      setCurrency(currentCurrency);
    }
  }, [isOpen, thresholds, currentCurrency]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ warning, critical }, currency);
    onClose();
  };

  const currencies = [
      { code: 'QAR', name: 'ريال قطري (QAR)', flag: '🇶🇦' },
      { code: 'SAR', name: 'ريال سعودي (SAR)', flag: '🇸🇦' },
      { code: 'AED', name: 'درهم إماراتي (AED)', flag: '🇦🇪' },
      { code: 'EGP', name: 'جنيه مصري (EGP)', flag: '🇪🇬' },
      { code: 'USD', name: 'دولار أمريكي ($)', flag: '🇺🇸' },
      { code: 'EUR', name: 'يورو (€)', flag: '🇪🇺' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-[fadeIn_0.2s_ease-out]">
        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">إعدادات التطبيق</h2>
        
        <div className="space-y-6 mb-6">
          
          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              العملة الأساسية
            </label>
            <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold text-gray-700"
            >
                {currencies.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
            </select>
          </div>

          <hr className="border-gray-100" />

          {/* Thresholds */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              تنبيه التحذير (المستوى الأول) %
            </label>
            <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={warning} 
                  onChange={(e) => setWarning(Number(e.target.value))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-400 outline-none font-semibold text-gray-800"
                  min="1" max="100"
                />
                <div className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-yellow-500 shadow-sm shrink-0" title="لون التنبيه"></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">يظهر الشريط باللون الأصفر عند الوصول لهذه النسبة.</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              تنبيه الخطر (المستوى الثاني) %
            </label>
            <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  value={critical} 
                  onChange={(e) => setCritical(Number(e.target.value))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none font-semibold text-gray-800"
                  min="1" max="100"
                />
                <div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-orange-600 shadow-sm shrink-0" title="لون التنبيه"></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">يظهر الشريط باللون البرتقالي عند تجاوز هذه النسبة.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md active:scale-95 transform duration-100"
          >
            حفظ التغييرات
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors active:scale-95 transform duration-100"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};