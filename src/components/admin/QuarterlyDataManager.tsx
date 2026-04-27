import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Building2, Briefcase, CalendarPlus, ChevronDown, Loader2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import FundLevelDataEntry from './FundLevelDataEntry';
import LPDataEntry from './LPDataEntry';
import PortfolioDataEntry from './PortfolioDataEntry';

const TABS = [
  { id: 'fund', label: 'Fund Level', icon: BarChart3 },
  { id: 'lp', label: 'LP / Company', icon: Building2 },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
] as const;

type TabId = typeof TABS[number]['id'];

interface QuarterlyDataManagerProps {
  onDataSaved?: () => void;
}

const ALL_QUARTERS = [1, 2, 3, 4];

async function fetchAvailableYears(): Promise<number[]> {
  const { data, error } = await supabase
    .from('fund_level')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error || !data) return [2026, 2025, 2024, 2023, 2022, 2021];

  const yearSet = new Set<number>();
  for (const key of Object.keys(data)) {
    const match = key.match(/_q\d_(\d{4})$/);
    if (match) yearSet.add(parseInt(match[1], 10));
  }

  if (yearSet.size === 0) return [2026, 2025, 2024, 2023, 2022, 2021];
  return Array.from(yearSet).sort((a, b) => b - a);
}

export default function QuarterlyDataManager({ onDataSaved }: QuarterlyDataManagerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('fund');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [availableYears, setAvailableYears] = useState<number[]>([2026, 2025, 2024, 2023, 2022, 2021]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchAvailableYears().then(setAvailableYears);
  }, [refreshKey]);

  const handleQuarterAdded = () => {
    setRefreshKey(k => k + 1);
    onDataSaved?.();
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 pt-5 sm:px-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Quarterly Data Entry</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter and manage fund, LP, and portfolio data by quarter
          </p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0a2547] text-white text-sm font-medium rounded-lg hover:bg-[#1a365d] transition-colors shadow-sm"
        >
          <CalendarPlus className="h-4 w-4" />
          Add Quarter
        </button>
      </div>

      <div className="px-4 sm:px-6 mt-4">
        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#0a2547] text-[#0a2547]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {activeTab === 'fund' && <FundLevelDataEntry onDataSaved={onDataSaved} availableYears={availableYears} />}
        {activeTab === 'lp' && <LPDataEntry onDataSaved={onDataSaved} availableYears={availableYears} />}
        {activeTab === 'portfolio' && <PortfolioDataEntry onDataSaved={onDataSaved} availableYears={availableYears} />}
      </div>

      {showAddDialog && (
        <AddQuarterDialog
          existingYears={availableYears}
          onClose={() => setShowAddDialog(false)}
          onSuccess={handleQuarterAdded}
        />
      )}
    </div>
  );
}

interface AddQuarterDialogProps {
  existingYears: number[];
  onClose: () => void;
  onSuccess: () => void;
}

function AddQuarterDialog({ existingYears, onClose, onSuccess }: AddQuarterDialogProps) {
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = currentYear + 2; y >= 2021; y--) {
    yearOptions.push(y);
  }

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showQuarterDropdown, setShowQuarterDropdown] = useState(false);
  const yearRef = useRef<HTMLDivElement>(null);
  const quarterRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) setShowYearDropdown(false);
      if (quarterRef.current && !quarterRef.current.contains(e.target as Node)) setShowQuarterDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = async () => {
    setStatus('loading');
    setErrorMsg('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus('error');
        setErrorMsg('Not authenticated. Please sign in again.');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-quarter`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quarter: selectedQuarter, year: selectedYear }),
      });

      const result = await res.json();

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(result.error || 'Failed to add quarter columns');
        return;
      }

      setStatus('success');
      onSuccess();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Add New Quarter</h3>
          <p className="text-sm text-gray-500 mt-1">
            This creates 19 database columns across all tables for the selected quarter.
          </p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Quarter selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Quarter</label>
              <div ref={quarterRef} className="relative">
                <button
                  onClick={() => { setShowQuarterDropdown(!showQuarterDropdown); setShowYearDropdown(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:border-gray-400 transition-colors"
                >
                  Q{selectedQuarter}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {showQuarterDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                    {ALL_QUARTERS.map(q => (
                      <button
                        key={q}
                        onClick={() => { setSelectedQuarter(q); setShowQuarterDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          q === selectedQuarter ? 'bg-blue-50 text-[#0a2547] font-medium' : 'text-gray-700'
                        }`}
                      >
                        Q{q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Year selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
              <div ref={yearRef} className="relative">
                <button
                  onClick={() => { setShowYearDropdown(!showYearDropdown); setShowQuarterDropdown(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:border-gray-400 transition-colors"
                >
                  {selectedYear}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {showYearDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-48 overflow-y-auto">
                    {yearOptions.map(y => (
                      <button
                        key={y}
                        onClick={() => { setSelectedYear(y); setShowYearDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          y === selectedYear ? 'bg-blue-50 text-[#0a2547] font-medium' : 'text-gray-700'
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

          {/* Status messages */}
          {status === 'error' && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <Check className="h-4 w-4 text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">
                Q{selectedQuarter} {selectedYear} columns added successfully!
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={status === 'loading'}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={status === 'loading' || status === 'success'}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0a2547] rounded-lg hover:bg-[#1a365d] transition-colors disabled:opacity-50"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : status === 'success' ? (
              <>
                <Check className="h-4 w-4" />
                Added
              </>
            ) : (
              'Add Quarter'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
