import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Check, AlertCircle, ChevronDown } from 'lucide-react';

const FUND_METRICS = [
  { label: 'Fund Size', prefix: 'fund_size', type: 'currency' },
  { label: 'Number of LPs', prefix: 'lp_count', type: 'integer' },
  { label: 'Total Called Capital', prefix: 'called_capital', type: 'currency' },
  { label: 'Total Investment Cost', prefix: 'investment_cost', type: 'currency' },
  { label: 'Total Investment Value', prefix: 'investment_value', type: 'currency' },
  { label: 'TVPI', prefix: 'tvpi', type: 'multiplier' },
  { label: 'MoIC', prefix: 'moic', type: 'multiplier' },
  { label: 'IRR', prefix: 'irr', type: 'percentage' },
  { label: 'Management Fee', prefix: 'management_fee', type: 'currency' },
  { label: 'OPEX', prefix: 'opex', type: 'currency' },
];

const DEFAULT_YEARS = [2026, 2025, 2024, 2023, 2022, 2021];
const QUARTERS = [1, 2, 3, 4];

interface FundLevelDataEntryProps {
  onDataSaved?: () => void;
  availableYears?: number[];
}

export default function FundLevelDataEntry({ onDataSaved, availableYears }: FundLevelDataEntryProps) {
  const YEARS = availableYears && availableYears.length > 0 ? availableYears : DEFAULT_YEARS;
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fundId, setFundId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showQuarterDropdown, setShowQuarterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowYearDropdown(false);
        setShowQuarterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadFundData();
  }, [selectedYear, selectedQuarter]);

  const loadFundData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fund_level')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFundId(data.id);
        const suffix = `_q${selectedQuarter}_${selectedYear}`;
        const values: Record<string, string> = {};
        FUND_METRICS.forEach(metric => {
          const key = `${metric.prefix}${suffix}`;
          const rawValue = data[key];
          if (rawValue !== null && rawValue !== undefined && rawValue !== 0) {
            if (metric.type === 'percentage') {
              values[metric.prefix] = (Number(rawValue) * 100).toString();
            } else {
              values[metric.prefix] = rawValue.toString();
            }
          } else {
            values[metric.prefix] = '';
          }
        });
        setFormData(values);
      } else {
        setFundId(null);
        setFormData({});
      }
    } catch (err) {
      console.error('Error loading fund data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (prefix: string, value: string) => {
    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({ ...prev, [prefix]: value }));
      setSaveStatus('idle');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const suffix = `_q${selectedQuarter}_${selectedYear}`;
      const updatePayload: Record<string, number> = {};

      FUND_METRICS.forEach(metric => {
        const key = `${metric.prefix}${suffix}`;
        const rawValue = formData[metric.prefix];
        if (rawValue !== undefined && rawValue !== '') {
          if (metric.type === 'percentage') {
            updatePayload[key] = parseFloat(rawValue) / 100;
          } else if (metric.type === 'integer') {
            updatePayload[key] = parseInt(rawValue, 10) || 0;
          } else {
            updatePayload[key] = parseFloat(rawValue) || 0;
          }
        } else {
          updatePayload[key] = 0;
        }
      });

      if (fundId) {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-update`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session?.access_token}`,
            },
            body: JSON.stringify({
              type: 'fund_metrics',
              p_fund_id: fundId,
              p_updates: updatePayload,
            }),
          }
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
      } else {
        updatePayload['updated_at' as any] = new Date().toISOString() as any;
        const { data, error } = await supabase
          .from('fund_level')
          .insert([updatePayload])
          .select()
          .maybeSingle();
        if (error) throw error;
        if (data) setFundId(data.id);
      }

      setSaveStatus('success');
      onDataSaved?.();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Error saving fund data:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const getPlaceholder = (type: string) => {
    switch (type) {
      case 'currency': return '0';
      case 'percentage': return '0.0';
      case 'multiplier': return '0.00';
      case 'integer': return '0';
      default: return '0';
    }
  };

  const getSuffix = (type: string) => {
    switch (type) {
      case 'percentage': return '%';
      case 'multiplier': return 'x';
      default: return '';
    }
  };

  const getPrefix = (type: string) => {
    return type === 'currency' ? '\u20AC' : '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Fund Level Data</h3>
          <p className="text-sm text-gray-500 mt-1">
            Enter or update fund-wide metrics for the selected quarter
          </p>
        </div>

        <div className="flex items-center gap-3" ref={dropdownRef}>
          <div className="relative">
            <button
              onClick={() => { setShowQuarterDropdown(!showQuarterDropdown); setShowYearDropdown(false); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Q{selectedQuarter}
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {showQuarterDropdown && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[80px]">
                {QUARTERS.map(q => (
                  <button
                    key={q}
                    onClick={() => { setSelectedQuarter(q); setShowQuarterDropdown(false); }}
                    className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                      q === selectedQuarter ? 'bg-[#0a2547]/5 text-[#0a2547] font-medium' : 'text-gray-700'
                    }`}
                  >
                    Q{q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => { setShowYearDropdown(!showYearDropdown); setShowQuarterDropdown(false); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {selectedYear}
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
            {showYearDropdown && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[100px]">
                {YEARS.map(y => (
                  <button
                    key={y}
                    onClick={() => { setSelectedYear(y); setShowYearDropdown(false); }}
                    className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                      y === selectedYear ? 'bg-[#0a2547]/5 text-[#0a2547] font-medium' : 'text-gray-700'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-10 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {FUND_METRICS.map(metric => (
            <div key={metric.prefix}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {metric.label}
              </label>
              <div className="relative">
                {getPrefix(metric.type) && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    {getPrefix(metric.type)}
                  </span>
                )}
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData[metric.prefix] || ''}
                  onChange={(e) => handleInputChange(metric.prefix, e.target.value)}
                  placeholder={getPlaceholder(metric.type)}
                  className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none transition-colors ${
                    getPrefix(metric.type) ? 'pl-8' : ''
                  } ${getSuffix(metric.type) ? 'pr-8' : ''}`}
                />
                {getSuffix(metric.type) && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    {getSuffix(metric.type)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="text-sm">
          {saveStatus === 'success' && (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <Check className="h-4 w-4" /> Saved successfully
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-red-600">
              <AlertCircle className="h-4 w-4" /> Failed to save. Try again.
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0a2547] text-white rounded-lg text-sm font-medium hover:bg-[#1a365d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Fund Data'}
        </button>
      </div>
    </div>
  );
}
