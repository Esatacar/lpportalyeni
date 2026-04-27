import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Check, AlertCircle, ChevronDown, Search, Plus, Trash2 } from 'lucide-react';

const PORTFOLIO_METRICS = [
  { label: 'Total Investment', prefix: 'total_investment' },
  { label: 'Total Value', prefix: 'total_value' },
];

const YEARS = [2025, 2024, 2023, 2022, 2021];
const QUARTERS = [1, 2, 3, 4];

interface PortfolioRow {
  id: string;
  portfolio_company_name: string;
  latest_ownership: number;
  latest_valuation: number;
  [key: string]: any;
}

interface PortfolioDataEntryProps {
  onDataSaved?: () => void;
}

export default function PortfolioDataEntry({ onDataSaved }: PortfolioDataEntryProps) {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [portfolioCompanies, setPortfolioCompanies] = useState<PortfolioRow[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [companyName, setCompanyName] = useState('');
  const [latestOwnership, setLatestOwnership] = useState('');
  const [latestValuation, setLatestValuation] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showQuarterDropdown, setShowQuarterDropdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);
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
    loadPortfolioCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      loadPortfolioData();
    }
  }, [selectedCompanyId, selectedYear, selectedQuarter]);

  const loadPortfolioCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_data')
        .select('id, portfolio_company_name, latest_ownership, latest_valuation')
        .order('portfolio_company_name', { ascending: true });

      if (error) throw error;
      setPortfolioCompanies(data || []);
      if (data && data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading portfolio companies:', err);
    }
  };

  const loadPortfolioData = async () => {
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portfolio_data')
        .select('*')
        .eq('id', selectedCompanyId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCompanyName(data.portfolio_company_name || '');
        setLatestOwnership(data.latest_ownership ? (Number(data.latest_ownership) * 100).toString() : '');
        setLatestValuation(data.latest_valuation ? data.latest_valuation.toString() : '');

        const suffix = `_q${selectedQuarter}_${selectedYear}`;
        const values: Record<string, string> = {};
        PORTFOLIO_METRICS.forEach(metric => {
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
      console.error('Error loading portfolio data:', err);
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

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    setAddingCompany(true);
    try {
      const { data, error } = await supabase
        .from('portfolio_data')
        .insert([{ portfolio_company_name: newCompanyName.trim() }])
        .select()
        .maybeSingle();

      if (error) throw error;

      if (data) {
        await loadPortfolioCompanies();
        setSelectedCompanyId(data.id);
        setNewCompanyName('');
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Error adding portfolio company:', err);
      alert('Failed to add company. Please try again.');
    } finally {
      setAddingCompany(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompanyId) return;
    const companyToDelete = portfolioCompanies.find(c => c.id === selectedCompanyId);
    if (!confirm(`Are you sure you want to delete "${companyToDelete?.portfolio_company_name}"? This will remove all its data.`)) return;

    try {
      const { error } = await supabase
        .from('portfolio_data')
        .delete()
        .eq('id', selectedCompanyId);

      if (error) throw error;

      setSelectedCompanyId(null);
      await loadPortfolioCompanies();
    } catch (err) {
      console.error('Error deleting portfolio company:', err);
      alert('Failed to delete. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!selectedCompanyId) return;
    setSaving(true);
    setSaveStatus('idle');
    try {
      const suffix = `_q${selectedQuarter}_${selectedYear}`;
      const updatePayload: Record<string, any> = {};

      PORTFOLIO_METRICS.forEach(metric => {
        const key = `${metric.prefix}${suffix}`;
        const rawValue = formData[metric.prefix];
        updatePayload[key] = rawValue !== undefined && rawValue !== '' ? parseFloat(rawValue) || 0 : 0;
      });

      if (companyName.trim()) {
        updatePayload.portfolio_company_name = companyName.trim();
      }
      if (latestOwnership !== '') {
        updatePayload.latest_ownership = parseFloat(latestOwnership) / 100;
      }
      if (latestValuation !== '') {
        updatePayload.latest_valuation = parseFloat(latestValuation) || 0;
      }

      updatePayload.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('portfolio_data')
        .update(updatePayload)
        .eq('id', selectedCompanyId);

      if (error) throw error;

      setSaveStatus('success');
      onDataSaved?.();
      loadPortfolioCompanies();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Error saving portfolio data:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const filteredCompanies = portfolioCompanies.filter(c =>
    c.portfolio_company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Portfolio Data</h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage portfolio companies and their quarterly investment data
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
              placeholder="Search portfolio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none transition-colors"
            />
          </div>

          {showAddForm ? (
            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              <input
                type="text"
                placeholder="Company name..."
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddCompany}
                  disabled={addingCompany || !newCompanyName.trim()}
                  className="flex-1 px-3 py-1.5 bg-[#0a2547] text-white text-sm rounded-lg disabled:opacity-50 hover:bg-[#1a365d] transition-colors"
                >
                  {addingCompany ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setNewCompanyName(''); }}
                  className="flex-1 px-3 py-1.5 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#0a2547] hover:text-[#0a2547] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Company
            </button>
          )}

          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[360px] overflow-y-auto">
            {filteredCompanies.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No portfolio companies</p>
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
                  <div className="font-medium truncate">{company.portfolio_company_name}</div>
                  <div className={`text-xs mt-0.5 ${company.id === selectedCompanyId ? 'text-white/70' : 'text-gray-400'}`}>
                    {company.latest_ownership ? `${(Number(company.latest_ownership) * 100).toFixed(1)}% ownership` : 'No ownership data'}
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
              Select a portfolio company to enter data
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                  <div className="h-10 bg-gray-100 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-medium text-gray-500">Company Details</div>
                  <button
                    onClick={handleDeleteCompany}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Company
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => { setCompanyName(e.target.value); setSaveStatus('idle'); }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Latest Ownership (%)</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={latestOwnership}
                        onChange={(e) => {
                          if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) {
                            setLatestOwnership(e.target.value);
                            setSaveStatus('idle');
                          }
                        }}
                        placeholder="0.0"
                        className="w-full pr-7 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Latest Valuation</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{'\u20AC'}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={latestValuation}
                        onChange={(e) => {
                          if (e.target.value === '' || /^-?\d*\.?\d*$/.test(e.target.value)) {
                            setLatestValuation(e.target.value);
                            setSaveStatus('idle');
                          }
                        }}
                        placeholder="0"
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-3">
                  Quarterly Data - Q{selectedQuarter} {selectedYear}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  {PORTFOLIO_METRICS.map(metric => (
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
          {saving ? 'Saving...' : 'Save Portfolio Data'}
        </button>
      </div>
    </div>
  );
}
