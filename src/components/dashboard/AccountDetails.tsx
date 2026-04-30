import React, { useState, useMemo } from 'react';
import { Table, ChevronDown, Check } from 'lucide-react';
import { accountMetrics } from '../../constants/accountMetrics';

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021];
const QUARTERS_DESC = [4, 3, 2, 1];

function findQuartersWithData(data: any) {
  if (!data) return [];

  const found: Array<{ year: number; quarter: number; value: string }> = [];

  for (const year of YEARS) {
    for (const quarter of QUARTERS_DESC) {
      const hasData = Object.keys(data).some(key => {
        if (key.endsWith(`_q${quarter}_${year}`)) {
          const v = data[key];
          return v !== null && v !== undefined && v !== 0;
        }
        return false;
      });
      if (hasData) {
        found.push({ year, quarter, value: `${year}-${quarter}` });
      }
    }
  }

  return found;
}

interface AccountDetailsProps {
  quarterOptions: Array<{
    year: number;
    quarter: number;
    label: string;
    value: string;
    selected: boolean;
  }>;
  selectedQuarters: Array<{
    year: number;
    quarter: number;
    label: string;
  }>;
  showQuarterSelector: boolean;
  setShowQuarterSelector: (show: boolean) => void;
  toggleQuarterSelection: (value: string) => void;
  quarterSelectorRef: React.RefObject<HTMLDivElement>;
  companyData: any;
  formatCurrency: (value: number) => string;
}

export default function AccountDetails({
  showQuarterSelector,
  setShowQuarterSelector,
  quarterSelectorRef,
  companyData,
  formatCurrency
}: AccountDetailsProps) {
  const allQuarters = useMemo(() => findQuartersWithData(companyData), [companyData]);

  const defaultSelected = useMemo(
    () => new Set(allQuarters.slice(0, 4).map(q => q.value)),
    [allQuarters]
  );

  const [selected, setSelected] = useState<Set<string> | null>(null);

  const activeSelected = selected ?? defaultSelected;

  const quarterOptions = useMemo(() =>
    allQuarters.map(q => ({
      year: q.year,
      quarter: q.quarter,
      label: `Q${q.quarter} ${q.year}`,
      value: q.value,
      selected: activeSelected.has(q.value)
    })),
    [allQuarters, activeSelected]
  );

  const toggleQuarterSelection = (value: string) => {
    setSelected(prev => {
      const current = prev ?? new Set(defaultSelected);
      const next = new Set(current);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const selectedQuarters = quarterOptions
    .filter(o => o.selected)
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.quarter - b.quarter);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 bg-[#0a1628] rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Table className="h-6 w-6 text-[#6dd8b0]" />
            <h3 className="ml-2 text-lg font-semibold text-white">LP Account Details</h3>
          </div>
          <div className="relative" ref={quarterSelectorRef}>
            <button
              onClick={() => setShowQuarterSelector(!showQuarterSelector)}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 text-white transition-colors"
            >
              <span>
                {selectedQuarters.length === 0
                  ? 'Select Quarters'
                  : `${selectedQuarters.length} Quarter${selectedQuarters.length === 1 ? '' : 's'} Selected`}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showQuarterSelector && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 border">
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Select Quarters to Compare</h4>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {quarterOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => toggleQuarterSelection(option.value)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors hover:bg-gray-50"
                      >
                        <span>{option.label}</span>
                        {option.selected && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-[#0a1628]/5 text-left text-sm font-medium text-[#0a2547] uppercase tracking-wider">
                  Metric
                </th>
                {selectedQuarters.map(({ year, quarter }) => (
                  <th
                    key={`${year}-${quarter}`}
                    className="px-4 py-3 bg-[#0a1628]/5 text-left text-sm font-medium text-[#0a2547] uppercase tracking-wider"
                  >
                    Q{quarter} {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accountMetrics.map(({ label, prefix }) => (
                <tr key={prefix} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                    {label}
                  </td>
                  {selectedQuarters.map(({ year, quarter }) => (
                    <td
                      key={`${prefix}-${year}-${quarter}`}
                      className="px-4 py-4 whitespace-nowrap text-base text-gray-900"
                    >
                      {formatCurrency(companyData[`${prefix}_q${quarter}_${year}`] || 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
