import React, { useState } from 'react';
import { Briefcase, TrendingUp, TrendingDown, Percent, ChevronDown, ArrowUpDown } from 'lucide-react';
import { useGlobalViewSettings } from '../../hooks/useGlobalViewSettings';

interface PortfolioData {
  portfolio_company_name: string;
  latest_ownership: number;
  latest_valuation: number;
  [key: string]: any;
}

interface PortfolioOverviewProps {
  portfolioData: PortfolioData[];
  formatCurrency: (value: number) => string;
}

export default function PortfolioOverview({ portfolioData, formatCurrency }: PortfolioOverviewProps) {
  const [showQuarterSelector, setShowQuarterSelector] = useState(false);
  const { settings, updateSettings } = useGlobalViewSettings();
  const selectedQuarter = settings.portfolioQuarter;
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: 'portfolio_company_name',
    direction: 'asc'
  });

  // Function to get available quarters for a given year based on actual data
  const getAvailableQuarters = (year: number) => {
    if (!portfolioData || portfolioData.length === 0) return [1];
    
    const availableQuarters: number[] = [];
    const quartersToCheck = [4, 3, 2, 1];
    
    for (const quarter of quartersToCheck) {
      // Check if any portfolio company has data for this quarter
      const hasData = portfolioData.some(company => {
        const fields = [
          `total_investment_q${quarter}_${year}`,
          `total_value_q${quarter}_${year}`
        ];
        
        return fields.some(field => {
          const value = company[field];
          return value !== null && value !== undefined && value > 0;
        });
      });
      
      if (hasData) {
        availableQuarters.push(quarter);
      }
    }
    
    return availableQuarters.length > 0 ? availableQuarters : [1];
  };

  // Format percentage by multiplying by 100 since the value is stored as a decimal
  const formatPercentage = (value: number) => {
    if (typeof value !== 'number') return '0.0%';
    return `${(value * 100).toFixed(1)}%`;
  };
  
  const calculateMoIC = (investment: number, value: number) => {
    if (investment === 0) return 0;
    return value / investment;
  };

  const getQuarterValue = (company: PortfolioData, prefix: string) => {
    return company[`${prefix}_q${selectedQuarter.quarter}_${selectedQuarter.year}`] || 0;
  };

  // Format currency with dollar sign
  const formatDollarCurrency = (value: number) => {
    return '$' + new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const years = [2026, 2025, 2024, 2023, 2022, 2021];

  const handleQuarterSelection = async (year: number, quarter: number) => {
    await updateSettings({
      portfolioQuarter: { year, quarter }
    });
    setShowQuarterSelector(false);
  };

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortedData = [...portfolioData].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortConfig.key) {
      case 'portfolio_company_name':
        aValue = a.portfolio_company_name;
        bValue = b.portfolio_company_name;
        break;
      case 'investment':
        aValue = getQuarterValue(a, 'total_investment');
        bValue = getQuarterValue(b, 'total_investment');
        break;
      case 'value':
        aValue = getQuarterValue(a, 'total_value');
        bValue = getQuarterValue(b, 'total_value');
        break;
      case 'moic':
        aValue = calculateMoIC(
          getQuarterValue(a, 'total_investment'),
          getQuarterValue(a, 'total_value')
        );
        bValue = calculateMoIC(
          getQuarterValue(b, 'total_investment'),
          getQuarterValue(b, 'total_value')
        );
        break;
      case 'ownership':
        aValue = a.latest_ownership;
        bValue = b.latest_ownership;
        break;
      case 'valuation':
        aValue = a.latest_valuation;
        bValue = b.latest_valuation;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader: React.FC<{ label: string; sortKey: string }> = ({ label, sortKey }) => (
    <th 
      className="px-4 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-5 bg-orange-50 border-b border-orange-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Briefcase className="h-6 w-6 text-orange-600" />
            <h3 className="ml-2 text-lg font-semibold text-orange-900">Portfolio Company Overview</h3>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowQuarterSelector(!showQuarterSelector)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50"
            >
              <span>Q{selectedQuarter.quarter} {selectedQuarter.year}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {showQuarterSelector && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 border">
                <div className="p-2 max-h-[300px] overflow-y-auto">
                  {years.map(year => (
                    <div key={year}>
                      {getAvailableQuarters(year).map(quarter => (
                        <button
                          key={`${year}-${quarter}`}
                          onClick={() => handleQuarterSelection(year, quarter)}
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
        </div>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <SortableHeader label="Company Name" sortKey="portfolio_company_name" />
                <SortableHeader label="Investment Cost" sortKey="investment" />
                <SortableHeader label="Investment Value" sortKey="value" />
                <SortableHeader label="MoIC" sortKey="moic" />
                <SortableHeader label="Latest Ownership" sortKey="ownership" />
                <SortableHeader label="Latest Valuation" sortKey="valuation" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedData.map((company) => {
                const investment = getQuarterValue(company, 'total_investment');
                const value = getQuarterValue(company, 'total_value');
                const moic = calculateMoIC(investment, value);
                const isPositiveReturn = moic >= 1;

                const TrendIcon = isPositiveReturn ? TrendingUp : TrendingDown;

                return (
                  <tr key={company.portfolio_company_name} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {company.portfolio_company_name}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatCurrency(investment)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatCurrency(value)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TrendIcon className={`h-4 w-4 mr-1 ${
                          isPositiveReturn ? 'text-green-500' : 'text-red-500'
                        }`} />
                        <span className={`text-sm font-medium ${
                          isPositiveReturn ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {moic.toFixed(2)}x
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Percent className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {formatPercentage(company.latest_ownership)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatDollarCurrency(company.latest_valuation)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {portfolioData.length === 0 && (
            <p className="text-center text-gray-500 py-4">No portfolio companies to display</p>
          )}
        </div>
      </div>
    </div>
  );
}