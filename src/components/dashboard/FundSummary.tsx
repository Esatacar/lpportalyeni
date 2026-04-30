import React from 'react';
import { BarChart4, ChevronDown, LineChart } from 'lucide-react';
import { metrics } from '../../constants/metrics';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface FundSummaryProps {
  fundLevelData: any;
  selectedPeriod?: { year: number; quarter: number };
  showPeriodSelector?: boolean;
  setShowPeriodSelector?: (show: boolean) => void;
  setSelectedPeriod?: (period: { year: number; quarter: number }) => void;
  periodSelectorRef?: React.RefObject<HTMLDivElement>;
  years: number[];
  quarters: number[]; // Not used anymore, kept for compatibility
  getValue: (prefix: string) => string;
}

function findLatestQuarterWithData(fundLevelData: any): { year: number; quarter: number } {
  if (!fundLevelData) {
    return { year: 2025, quarter: 1 };
  }

  // Start from latest possible quarter and work backwards
  const years = [2026, 2025, 2024, 2023, 2022, 2021];

  for (const year of years) {
    // Check all possible quarters for each year
    const quarters = [4, 3, 2, 1];
    
    for (const quarter of quarters) {
      // Check if any metric has data for this quarter
      const hasData = metrics.some(({ prefix }) => {
        const value = fundLevelData[`${prefix}_q${quarter}_${year}`];
        return value !== null && value !== undefined && value !== 0;
      });

      if (hasData) {
        return { year, quarter };
      }
    }
  }

  // If no data found, return Q1 2021 as fallback
  return { year: 2021, quarter: 1 };
}

export default function FundSummary({
  fundLevelData,
  selectedPeriod,
  showPeriodSelector = false,
  setShowPeriodSelector = () => {},
  setSelectedPeriod = () => {},
  periodSelectorRef,
  years,
  quarters, // Not used anymore
  getValue
}: FundSummaryProps) {
  // If no selectedPeriod is provided, find the latest quarter with data
  const effectivePeriod = selectedPeriod || findLatestQuarterWithData(fundLevelData);

  // Function to get available quarters for a given year based on actual data
  const getAvailableQuarters = (year: number) => {
    if (!fundLevelData) return [1];
    
    const availableQuarters: number[] = [];
    const quartersToCheck = [4, 3, 2, 1];
    
    for (const quarter of quartersToCheck) {
      // Check if any metric has data for this quarter
      const hasData = Object.keys(fundLevelData).some(key => {
        if (key.endsWith(`_q${quarter}_${year}`)) {
          const value = fundLevelData[key];
          return value !== null && value !== undefined && value !== 0;
        }
        return false;
      });
      
      if (hasData) {
        availableQuarters.push(quarter);
      }
    }
    
    return availableQuarters.length > 0 ? availableQuarters : [1];
  };

  const getColorClass = () => {
    return { bg: 'bg-[#0a1628]', text: 'text-[#6dd8b0]', border: 'border-[#0a1628]' };
  };

  const getPerformanceData = () => {
    if (!fundLevelData) return [];
    
    const data = [];
    
    // Reverse the years array to start from oldest
    const sortedYears = [...years].reverse();
    
    sortedYears.forEach(year => {
      // Get available quarters based on actual data
      const availableQuarters = getAvailableQuarters(year);
      
      // Sort quarters in ascending order for chronological display
      availableQuarters.sort((a, b) => a - b).forEach(quarter => {
        const tvpi = fundLevelData[`tvpi_q${quarter}_${year}`] || 0;
        const irr = fundLevelData[`irr_q${quarter}_${year}`] * 100 || 0; // Convert decimal to percentage
        
        if (tvpi > 0 || irr > 0) {
          data.push({
            name: `Q${quarter} ${year}`,
            tvpi,
            irr
          });
        }
      });
    });
    
    return data;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const PerformanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const tvpi = payload.find((p: any) => p.dataKey === 'tvpi')?.value || 0;
      const irr = payload.find((p: any) => p.dataKey === 'irr')?.value || 0;

      return (
        <div className="bg-[#0a1628] p-3 rounded-lg shadow-lg border border-white/10">
          <p className="text-sm font-medium mb-1 text-white">{label}</p>
          <p className="text-sm text-gray-300">
            TVPI: {tvpi.toFixed(2)}x
          </p>
          <p className="text-sm text-gray-300">
            IRR: {formatPercentage(irr)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-5 bg-[#0a1628] rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BarChart4 className="h-6 w-6 text-[#6dd8b0]" />
            <h3 className="ml-2 text-lg font-semibold text-white">Fund Financial Summary</h3>
          </div>
          {setShowPeriodSelector && setSelectedPeriod && (
            <div className="relative" ref={periodSelectorRef}>
              <button
                onClick={() => setShowPeriodSelector(!showPeriodSelector)}
                className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <span>Q{effectivePeriod.quarter} {effectivePeriod.year}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showPeriodSelector && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 border">
                  <div className="p-2 h-[300px] overflow-y-auto">
                    {years.map(year => (
                      <div key={year}>
                        {getAvailableQuarters(year).map(quarter => (
                          <button
                            key={`${year}-${quarter}`}
                            onClick={() => {
                              setSelectedPeriod({ year, quarter });
                              setShowPeriodSelector(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
                          >
                            Q{quarter} {year}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {metrics.map(({ label, prefix, icon: Icon }) => {
            const colorClasses = getColorClass();
            return (
              <div
                key={prefix}
                className={`p-4 rounded-lg border ${colorClasses.border} ${colorClasses.bg}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm font-medium ${colorClasses.text}`}>{label}</p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      {getValue(prefix)}
                    </p>
                  </div>
                  <Icon className={`h-5 w-5 ${colorClasses.text}`} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 border-t border-gray-100 pt-8">
          <div className="flex items-center mb-4">
            <LineChart className="h-6 w-6 text-[#0a2547] mr-2" />
            <h4 className="text-lg font-semibold text-[#0a2547]">Performance Metrics</h4>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart 
                data={getPerformanceData()} 
                margin={{ top: 20, right: 60, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval={0}
                  tick={{ fill: '#4B5563' }}
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(value) => `${value.toFixed(2)}x`}
                  tick={{ fill: '#4B5563' }}
                  domain={[1, 'auto']} // Set minimum value to 1.00x
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={formatPercentage}
                  tick={{ fill: '#4B5563' }}
                />
                <Tooltip content={<PerformanceTooltip />} />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="tvpi" 
                  name="TVPI"
                  stroke="#0a2547" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="irr"
                  name="IRR"
                  stroke="#6dd8b0"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}