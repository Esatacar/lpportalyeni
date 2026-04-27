import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Check, AlertCircle, ChevronDown, Search } from 'lucide-react';

const LP_METRICS = [
  { label: 'Paid Capital', prefix: 'paid_capital' },
  { label: 'NAV', prefix: 'nav' },
  { label: 'Distributions', prefix: 'distributions' },
  { label: 'Management Fee', prefix: 'management_fee' },
  { label: 'OPEX', prefix: 'opex' },
  { label: 'Unrealized Gains', prefix: 'unrealized_gains' },
  { label: 'Realized Gains', prefix: 'realized_gains' },
];

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021];
const QUARTERS = [1, 2, 3, 4];

interface CompanyRow {
  id: string;
  company_no: string;
  company_name: string;
  total_commitment: number;
  [key: string]: any;
}

interface LPDataEntryProps {
  onDataSaved?: () => void;
}

export default function LPDataEntry({ onDataSaved }: LPDataEntryProps) {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [totalCommitment, setTotalCommitment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
    loadCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      loadCompanyData();
    }
  }, [selectedCompanyId, selectedYear, selectedQuarter]);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('company_data')
        .select('id, company_no, company_name, total_commitment')
        .order('company_no', { ascending: true });

      if (error) throw error;
      setCompanies(data || []);
      if (data && data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  };

  const loadCompanyData = async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_data')
        .select('*')
        .eq('id', selectedCompanyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTotalCommitment(data.total_commitment ? data.total_commitment.toString() : '');
        const suffix = `_q${selectedQuarter}_${selectedYear}`;
        const values: Record<string, string> = {};
        LP_METRICS.forEach(metric => {
          const key = `${metric.prefix}${suffix}`;
          const rawValue = data[key];
          if (rawValue !== null && rawValue !== undefined && rawValue !== 0) {
            values[metric.prefix] = rawValue.toString();
          } else {
            values[metric.prefix] = '';
          }
        });
        setFormData(values);
      }
    } catch (err) {
      console.error('Error loading company data:', err);
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
    if (!selectedCompanyId) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const suffix = `_q${selectedQuarter}_${selectedYear}`;
      const updatePayload: Record<string, any> = {};

      LP_METRICS.forEach(metric => {
        const key = `${metric.prefix}${suffix}`;
        const rawValue = formData[metric.prefix];
        updatePayload[key] = rawValue !== undefined && rawValue !== '' ? parseFloat(rawValue) || 0 : 0;
      });

      if (totalCommitment !== '') {
        updatePayload.total_commitment = parseFloat(totalCommitment) || 0;
      }

      updatePayload.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('company_data')
        .update(updatePayload)
        .eq('id', selectedCompanyId);

      if (error) throw error;

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

  const filteredCompanies = companies.filter(c =>
    c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company_no.toString().includes(searchQuery)
  );

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const formatCurrency = (value: number) => {
    return '\u20AC ' + new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">LP / Company Data</h3>
          <p className="text-sm text-gray-500 mt-1">
            Select an LP and enter quarterly account data
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Company selector sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none transition-colors"
            />
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[420px] overflow-y-auto">
            {filteredCompanies.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No companies found</p>
            ) : (
              filteredCompanies.map(company => (
                <button
                  key={company.id}
                  onClick={() => { setSelectedCompanyId(company.id); setSaveStatus('idle'); }}
                  className={`w-full text-left px-4 py-3 text-sm border-b border-gray-100 last:border-b-0 transition-colors ${
                    company.id === selectedCompanyId
                      ? 'bg-[#0a2547] text-white'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="font-medium truncate">{company.company_name}</div>
                  <div className={`text-xs mt-0.5 ${company.id === selectedCompanyId ? 'text-white/70' : 'text-gray-400'}`}>
                    No. {company.company_no} &middot; {formatCurrency(company.total_commitment)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Data entry form */}
        <div className="lg:col-span-3">
          {!selectedCompanyId ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Select a company to enter data
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                  <div className="h-10 bg-gray-100 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{selectedCompany?.company_name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Company No. {selectedCompany?.company_no}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Total Commitment</div>
                  <div className="relative inline-block">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{'\u20AC'}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={totalCommitment}
                      onChange={(e) => {
                        if (e.target.value === '' || /^-?\d*\.?\d*$/.test(e.target.value)) {
                          setTotalCommitment(e.target.value);
                          setSaveStatus('idle');
                        }
                      }}
                      className="w-40 pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right font-medium focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                {LP_METRICS.map(metric => (
                  <div key={metric.prefix}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {metric.label}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{'\u20AC'}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData[metric.prefix] || ''}
                        onChange={(e) => handleInputChange(metric.prefix, e.target.value)}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
          disabled={saving || loading || !selectedCompanyId}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0a2547] text-white rounded-lg text-sm font-medium hover:bg-[#1a365d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save LP Data'}
        </button>
      </div>
    </div>
  );
}
