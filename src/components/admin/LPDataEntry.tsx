import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Check, AlertCircle, ChevronDown, ClipboardPaste } from 'lucide-react';

const LP_METRICS = [
  { label: 'Paid Capital', prefix: 'paid_capital' },
  { label: 'NAV', prefix: 'nav' },
  { label: 'Distributions', prefix: 'distributions' },
  { label: 'Management Fee', prefix: 'management_fee' },
  { label: 'OPEX', prefix: 'opex' },
  { label: 'Unrealized Gains', prefix: 'unrealized_gains' },
  { label: 'Realized Gains', prefix: 'realized_gains' },
];

const DEFAULT_YEARS = [2026, 2025, 2024, 2023, 2022, 2021];
const QUARTERS = [1, 2, 3, 4];

interface CompanyRow {
  id: string;
  company_no: string;
  company_name: string;
  total_commitment: number;
}

interface LPDataEntryProps {
  onDataSaved?: () => void;
  availableYears?: number[];
}

export default function LPDataEntry({ onDataSaved, availableYears }: LPDataEntryProps) {
  const YEARS = availableYears && availableYears.length > 0 ? availableYears : DEFAULT_YEARS;
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedMetric, setSelectedMetric] = useState(LP_METRICS[0]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showQuarterDropdown, setShowQuarterDropdown] = useState(false);
  const [showMetricDropdown, setShowMetricDropdown] = useState(false);
  const [pasteTarget, setPasteTarget] = useState<string | null>(null);
  const [pasteCount, setPasteCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowYearDropdown(false);
        setShowQuarterDropdown(false);
        setShowMetricDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (companies.length > 0) {
      loadMetricValues();
    }
  }, [companies, selectedYear, selectedQuarter, selectedMetric]);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('company_data')
        .select('id, company_no, company_name, total_commitment')
        .order('company_no', { ascending: true });

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  };

  const loadMetricValues = async () => {
    setLoading(true);
    try {
      const columnKey = `${selectedMetric.prefix}_q${selectedQuarter}_${selectedYear}`;
      const { data, error } = await supabase
        .from('company_data')
        .select(`id, ${columnKey}`)
        .order('company_no', { ascending: true });

      if (error) throw error;

      const vals: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        const v = row[columnKey];
        vals[row.id] = v !== null && v !== undefined && v !== 0 ? v.toString() : '';
      });
      setValues(vals);
    } catch (err) {
      console.error('Error loading metric values:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (companyId: string, value: string) => {
    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
      setValues(prev => ({ ...prev, [companyId]: value }));
      setSaveStatus('idle');
    }
  };

  const parseExcelValue = (raw: string): string => {
    let s = raw.trim();
    s = s.replace(/^[\s"']+|[\s"']+$/g, '');
    s = s.replace(/[\u20AC$\u00A3\u00A5,\s]/g, '');
    s = s.replace(/\./g, '_DOT_').replace(/,/g, '.').replace(/_DOT_/g, '.');
    if (s === '' || s === '-') return '';
    if (/^-?\d*\.?\d+$/.test(s)) return s;
    return '';
  };

  const handlePaste = useCallback((e: React.ClipboardEvent, startCompanyId: string) => {
    const pastedText = e.clipboardData.getData('text');
    const lines = pastedText
      .split(/[\r\n]+/)
      .map(line => line.split('\t')[0])
      .map(cell => cell.trim())
      .filter(cell => cell !== '');

    if (lines.length <= 1) return;

    e.preventDefault();

    const startIndex = companies.findIndex(c => c.id === startCompanyId);
    if (startIndex === -1) return;

    const newValues = { ...values };
    let filledCount = 0;
    lines.forEach((line, i) => {
      const targetIndex = startIndex + i;
      if (targetIndex < companies.length) {
        const parsed = parseExcelValue(line);
        newValues[companies[targetIndex].id] = parsed;
        filledCount++;
      }
    });

    setValues(newValues);
    setSaveStatus('idle');
    setPasteTarget(startCompanyId);
    setPasteCount(filledCount);
    setTimeout(() => { setPasteTarget(null); setPasteCount(0); }, 2500);
  }, [companies, values]);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const columnKey = `${selectedMetric.prefix}_q${selectedQuarter}_${selectedYear}`;

      const updates = companies.map(company => {
        const rawValue = values[company.id];
        const numValue = rawValue !== undefined && rawValue !== '' ? parseFloat(rawValue) || 0 : 0;
        return supabase
          .from('company_data')
          .update({
            [columnKey]: numValue,
            updated_at: new Date().toISOString(),
          })
          .eq('id', company.id)
          .select('id');
      });

      const results = await Promise.all(updates);
      const hasError = results.some(r => r.error);
      if (hasError) {
        const firstError = results.find(r => r.error);
        throw new Error(firstError?.error?.message || 'Some updates failed');
      }

      const allEmpty = results.every(r => !r.data || r.data.length === 0);
      if (allEmpty && companies.length > 0) {
        throw new Error('No rows were updated. You may need to sign out and sign back in.');
      }

      setSaveStatus('success');
      onDataSaved?.();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Error saving LP data:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return '\u20AC ' + new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const filledCount = Object.values(values).filter(v => v !== '').length;

  return (
    <div className="space-y-6">
      {/* Header with selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">LP / Company Data</h3>
          <p className="text-sm text-gray-500 mt-1">
            Select a metric and quarter, then enter values for all LPs at once
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap" ref={dropdownRef}>
          {/* Metric selector */}
          <div className="relative">
            <button
              onClick={() => { setShowMetricDropdown(!showMetricDropdown); setShowQuarterDropdown(false); setShowYearDropdown(false); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0a2547] text-white rounded-lg text-sm font-medium hover:bg-[#1a365d] transition-colors min-w-[160px] justify-between"
            >
              {selectedMetric.label}
              <ChevronDown className="h-4 w-4 text-white/70" />
            </button>
            {showMetricDropdown && (
              <div className="absolute left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[200px]">
                {LP_METRICS.map(m => (
                  <button
                    key={m.prefix}
                    onClick={() => { setSelectedMetric(m); setShowMetricDropdown(false); }}
                    className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${
                      m.prefix === selectedMetric.prefix ? 'bg-[#0a2547]/5 text-[#0a2547] font-medium' : 'text-gray-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quarter selector */}
          <div className="relative">
            <button
              onClick={() => { setShowQuarterDropdown(!showQuarterDropdown); setShowYearDropdown(false); setShowMetricDropdown(false); }}
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

          {/* Year selector */}
          <div className="relative">
            <button
              onClick={() => { setShowYearDropdown(!showYearDropdown); setShowQuarterDropdown(false); setShowMetricDropdown(false); }}
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

      {/* Paste hint / feedback */}
      <div className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
        pasteCount > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-100'
      }`}>
        {pasteCount > 0 ? (
          <>
            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="text-xs text-emerald-700 font-medium">
              Pasted {pasteCount} values successfully. Click "Save All" to persist.
            </p>
          </>
        ) : (
          <>
            <ClipboardPaste className="h-4 w-4 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700">
              Copy a column from Excel, click the first input field, then Ctrl+V / Cmd+V. Values fill downward automatically. Supports up to {companies.length} rows.
            </p>
          </>
        )}
      </div>

      {/* Bulk entry table */}
      <div ref={tableRef} className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">Total Commitment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-56">
                  {selectedMetric.label} (Q{selectedQuarter} {selectedYear})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="h-4 w-8 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-40 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-100 rounded animate-pulse ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-9 w-full bg-gray-100 rounded-lg animate-pulse" /></td>
                  </tr>
                ))
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                    No LP companies found
                  </td>
                </tr>
              ) : (
                companies.map((company, index) => (
                  <tr
                    key={company.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      pasteTarget === company.id ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-sm text-gray-400 font-mono">{index + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="text-sm font-medium text-gray-900">{company.company_name}</div>
                      <div className="text-xs text-gray-400">No. {company.company_no}</div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 text-right font-mono">
                      {formatCurrency(company.total_commitment)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{'\u20AC'}</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={values[company.id] || ''}
                          onChange={(e) => handleValueChange(company.id, e.target.value)}
                          onPaste={(e) => handlePaste(e, company.id)}
                          placeholder="0"
                          className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none transition-colors font-mono"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer with save */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {filledCount} of {companies.length} values entered
          </div>
          {saveStatus === 'success' && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <Check className="h-4 w-4" /> Saved successfully
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-sm text-red-600">
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
          {saving ? 'Saving...' : `Save All ${selectedMetric.label}`}
        </button>
      </div>
    </div>
  );
}
