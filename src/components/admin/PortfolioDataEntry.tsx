import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Check, AlertCircle, ChevronDown, ClipboardPaste, Plus, Trash2 } from 'lucide-react';

const PORTFOLIO_METRICS = [
  { label: 'Total Investment', prefix: 'total_investment' },
  { label: 'Total Value', prefix: 'total_value' },
  { label: 'Latest Ownership (%)', prefix: 'latest_ownership', isStatic: true },
  { label: 'Latest Valuation', prefix: 'latest_valuation', isStatic: true, isText: true },
  { label: 'Website URL', prefix: 'website_url', isStatic: true, isText: true },
];

const DEFAULT_YEARS = [2026, 2025, 2024, 2023, 2022, 2021];
const QUARTERS = [1, 2, 3, 4];

interface PortfolioRow {
  id: string;
  portfolio_company_name: string;
  latest_ownership: number;
  latest_valuation_text: string;
  website_url: string;
}

interface PortfolioDataEntryProps {
  onDataSaved?: () => void;
  availableYears?: number[];
}

export default function PortfolioDataEntry({ onDataSaved, availableYears }: PortfolioDataEntryProps) {
  const YEARS = availableYears && availableYears.length > 0 ? availableYears : DEFAULT_YEARS;
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedMetric, setSelectedMetric] = useState(PORTFOLIO_METRICS[0]);
  const [portfolioCompanies, setPortfolioCompanies] = useState<PortfolioRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showQuarterDropdown, setShowQuarterDropdown] = useState(false);
  const [showMetricDropdown, setShowMetricDropdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);
  const [pasteTarget, setPasteTarget] = useState<string | null>(null);
  const [pasteCount, setPasteCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isStaticMetric = selectedMetric.isStatic;
  const isTextMetric = 'isText' in selectedMetric && selectedMetric.isText;

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
    loadPortfolioCompanies();
  }, []);

  useEffect(() => {
    if (portfolioCompanies.length > 0) {
      loadMetricValues();
    }
  }, [portfolioCompanies, selectedYear, selectedQuarter, selectedMetric]);

  const loadPortfolioCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_data')
        .select('id, portfolio_company_name, latest_ownership, latest_valuation_text, website_url')
        .order('portfolio_company_name', { ascending: true });

      if (error) throw error;
      setPortfolioCompanies(data || []);
    } catch (err) {
      console.error('Error loading portfolio companies:', err);
    }
  };

  const loadMetricValues = async () => {
    setLoading(true);
    try {
      let columnKey: string;
      if (selectedMetric.prefix === 'latest_valuation') {
        columnKey = 'latest_valuation_text';
      } else if (isStaticMetric) {
        columnKey = selectedMetric.prefix;
      } else {
        columnKey = `${selectedMetric.prefix}_q${selectedQuarter}_${selectedYear}`;
      }

      const { data, error } = await supabase
        .from('portfolio_data')
        .select(`id, ${columnKey}`)
        .order('portfolio_company_name', { ascending: true });

      if (error) throw error;

      const vals: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        const v = row[columnKey];
        if (isTextMetric) {
          vals[row.id] = v ? v.toString() : '';
        } else if (v !== null && v !== undefined && v !== 0) {
          if (selectedMetric.prefix === 'latest_ownership') {
            vals[row.id] = (Number(v) * 100).toString();
          } else {
            vals[row.id] = v.toString();
          }
        } else {
          vals[row.id] = '';
        }
      });
      setValues(vals);
    } catch (err) {
      console.error('Error loading metric values:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (companyId: string, value: string) => {
    if (isTextMetric || value === '' || /^-?\d*\.?\d*$/.test(value)) {
      setValues(prev => ({ ...prev, [companyId]: value }));
      setSaveStatus('idle');
    }
  };

  const parseExcelValue = (raw: string): string => {
    let s = raw.trim();
    s = s.replace(/^[\s"']+|[\s"']+$/g, '');
    const isNegative = /^\(.*\)$/.test(s) || /^[-\u2212\u2013]/.test(s);
    s = s.replace(/[()\u2212\u2013]/g, '');
    s = s.replace(/[\u20AC$\u00A3\u00A5\s]/g, '');
    s = s.replace(/,/g, '');
    if (s === '' || s === '-') return '';
    if (/^\d*\.?\d+$/.test(s)) return isNegative ? '-' + s : s;
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

    const startIndex = portfolioCompanies.findIndex(c => c.id === startCompanyId);
    if (startIndex === -1) return;

    const newValues = { ...values };
    let filledCount = 0;
    lines.forEach((line, i) => {
      const targetIndex = startIndex + i;
      if (targetIndex < portfolioCompanies.length) {
        const parsed = isTextMetric ? line : parseExcelValue(line);
        newValues[portfolioCompanies[targetIndex].id] = parsed;
        filledCount++;
      }
    });

    setValues(newValues);
    setSaveStatus('idle');
    setPasteTarget(startCompanyId);
    setPasteCount(filledCount);
    setTimeout(() => { setPasteTarget(null); setPasteCount(0); }, 2500);
  }, [portfolioCompanies, values, isTextMetric]);

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    setAddingCompany(true);
    try {
      const { error } = await supabase
        .from('portfolio_data')
        .insert([{ portfolio_company_name: newCompanyName.trim() }]);

      if (error) throw error;

      await loadPortfolioCompanies();
      setNewCompanyName('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding portfolio company:', err);
      alert('Failed to add company. Please try again.');
    } finally {
      setAddingCompany(false);
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will remove all its data.`)) return;
    try {
      const { error } = await supabase
        .from('portfolio_data')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadPortfolioCompanies();
    } catch (err) {
      console.error('Error deleting portfolio company:', err);
      alert('Failed to delete. Please try again.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      let columnKey: string;
      if (isStaticMetric) {
        columnKey = selectedMetric.prefix;
      } else {
        columnKey = `${selectedMetric.prefix}_q${selectedQuarter}_${selectedYear}`;
      }

      const updates = portfolioCompanies.map(company => {
        const rawValue = values[company.id];
        if (isTextMetric) {
          return { id: company.id, value: rawValue || '' };
        }
        let numValue: number;
        if (selectedMetric.prefix === 'latest_ownership') {
          numValue = rawValue !== undefined && rawValue !== '' ? (parseFloat(rawValue) || 0) / 100 : 0;
        } else {
          numValue = rawValue !== undefined && rawValue !== '' ? parseFloat(rawValue) || 0 : 0;
        }
        return { id: company.id, value: numValue };
      });

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
            type: 'portfolio_metric',
            p_column_key: columnKey,
            p_updates: updates,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setSaveStatus('success');
      onDataSaved?.();
      if (isStaticMetric) loadPortfolioCompanies();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Error saving portfolio data:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const getInputPrefix = () => {
    if (selectedMetric.prefix === 'latest_ownership' || isTextMetric) return '';
    return '\u20AC';
  };

  const getInputSuffix = () => {
    if (selectedMetric.prefix === 'latest_ownership') return '%';
    return '';
  };

  const filledCount = Object.values(values).filter(v => v !== '').length;

  return (
    <div className="space-y-6">
      {/* Header with selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Portfolio Data</h3>
          <p className="text-sm text-gray-500 mt-1">
            Select a metric and quarter, then enter values for all portfolio companies
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
                {PORTFOLIO_METRICS.map(m => (
                  <button
                    key={m.prefix}
                    onClick={() => { setSelectedMetric(m); setShowMetricDropdown(false); }}
                    className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${
                      m.prefix === selectedMetric.prefix ? 'bg-[#0a2547]/5 text-[#0a2547] font-medium' : 'text-gray-700'
                    }`}
                  >
                    {m.label}
                    {m.isStatic && <span className="ml-2 text-xs text-gray-400">(non-quarterly)</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quarter/Year selectors - hidden for static metrics */}
          {!isStaticMetric && (
            <>
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
            </>
          )}
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
              Copy a column from Excel, click the first input field, then Ctrl+V / Cmd+V. Values fill downward automatically. Supports up to {portfolioCompanies.length} rows.
            </p>
          </>
        )}
      </div>

      {/* Add company */}
      <div>
        {showAddForm ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="New company name..."
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="flex-1 max-w-xs px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCompany(); }}
            />
            <button
              onClick={handleAddCompany}
              disabled={addingCompany || !newCompanyName.trim()}
              className="px-4 py-2 bg-[#0a2547] text-white text-sm rounded-lg disabled:opacity-50 hover:bg-[#1a365d] transition-colors"
            >
              {addingCompany ? 'Adding...' : 'Add'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewCompanyName(''); }}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#0a2547] hover:text-[#0a2547] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Portfolio Company
          </button>
        )}
      </div>

      {/* Bulk entry table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-56">
                  {selectedMetric.label}
                  {!isStaticMetric && ` (Q${selectedQuarter} ${selectedYear})`}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="h-4 w-8 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-40 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-9 w-full bg-gray-100 rounded-lg animate-pulse" /></td>
                    <td className="px-4 py-3"></td>
                  </tr>
                ))
              ) : portfolioCompanies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                    No portfolio companies found. Add one above.
                  </td>
                </tr>
              ) : (
                portfolioCompanies.map((company, index) => (
                  <tr
                    key={company.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      pasteTarget === company.id ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 text-sm text-gray-400 font-mono">{index + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="text-sm font-medium text-gray-900">{company.portfolio_company_name}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="relative">
                        {getInputPrefix() && (
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{getInputPrefix()}</span>
                        )}
                        <input
                          type="text"
                          inputMode={isTextMetric ? 'text' : 'decimal'}
                          value={values[company.id] || ''}
                          onChange={(e) => handleValueChange(company.id, e.target.value)}
                          onPaste={(e) => handlePaste(e, company.id)}
                          placeholder={isTextMetric ? 'Enter valuation...' : '0'}
                          className={`w-full py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none transition-colors ${
                            isTextMetric ? '' : 'font-mono '
                          }${getInputPrefix() ? 'pl-8' : 'pl-3'} ${getInputSuffix() ? 'pr-8' : 'pr-3'}`}
                        />
                        {getInputSuffix() && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{getInputSuffix()}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => handleDeleteCompany(company.id, company.portfolio_company_name)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Delete company"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
            {filledCount} of {portfolioCompanies.length} values entered
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
