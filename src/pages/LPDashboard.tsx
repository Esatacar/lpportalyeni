import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LogOut } from 'lucide-react';
import BasicInfo from '../components/dashboard/BasicInfo';
import Commitment from '../components/dashboard/Commitment';
import QuarterPerformance from '../components/dashboard/QuarterPerformance';
import FundSummary from '../components/dashboard/FundSummary';
import AccountDetails from '../components/dashboard/AccountDetails';
import FinancialOverview from '../components/dashboard/FinancialOverview';
import NoInvestor from '../components/dashboard/NoInvestor';
import PortfolioOverview from '../components/dashboard/PortfolioOverview';
import UsefulLinks from '../components/dashboard/UsefulLinks';
import { useUsefulLinks } from '../hooks/useUsefulLinks';

interface CompanyData {
  id: string;
  company_no: string;
  company_name: string;
  total_commitment: number;
  [key: string]: any;
}

interface FundLevelData {
  id: string;
  [key: string]: any;
}

interface Period {
  year: number;
  quarter: number;
}

interface QuarterData {
  quarter: number;
  year: number;
  paidCapital: number;
  nav: number;
  difference: number;
}

interface ChartData {
  name: string;
  paidCapital: number;
  nav: number;
}

interface QuarterOption {
  year: number;
  quarter: number;
  label: string;
  value: string;
  selected: boolean;
}

// Define available years and quarters
const years = [2026, 2025, 2024, 2023, 2022, 2021];
const regularQuarters = [4, 3, 2, 1]; // All quarters for other years

// Function to get available quarters for a given year based on actual data
const getAvailableQuarters = (year: number, data: any) => {
  if (!data) return year === 2025 ? [1] : regularQuarters;
  
  const availableQuarters: number[] = [];
  const quartersToCheck = year === 2025 ? [1, 2, 3, 4] : regularQuarters;
  
  for (const quarter of quartersToCheck) {
    // Check if any metric has data for this quarter
    const hasData = Object.keys(data).some(key => {
      if (key.endsWith(`_q${quarter}_${year}`)) {
        const value = data[key];
        return value !== null && value !== undefined && value !== 0;
      }
      return false;
    });
    
    if (hasData) {
      availableQuarters.push(quarter);
    }
  }
  
  return availableQuarters.length > 0 ? availableQuarters.sort((a, b) => b - a) : [1];
};

export default function LPDashboard() {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [fundLevelData, setFundLevelData] = useState<FundLevelData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>({ year: 2025, quarter: 1 });
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const [quarterOptions, setQuarterOptions] = useState<QuarterOption[]>([]);
  const [showQuarterSelector, setShowQuarterSelector] = useState(false);
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { links: usefulLinks } = useUsefulLinks();

  const periodSelectorRef = useRef<HTMLDivElement>(null);
  const quarterSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodSelectorRef.current && !periodSelectorRef.current.contains(event.target as Node)) {
        setShowPeriodSelector(false);
      }
      if (quarterSelectorRef.current && !quarterSelectorRef.current.contains(event.target as Node)) {
        setShowQuarterSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchCompanyData();
      fetchFundLevelData();
      fetchPortfolioData();
      initializeQuarterOptions();
    }
  }, [user?.id]);

  useEffect(() => {
    if (fundLevelData) {
      const latestPeriod = findLatestPeriod();
      if (latestPeriod) {
        setSelectedPeriod(latestPeriod);
      }
    }
  }, [fundLevelData]);

  const fetchPortfolioData = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_data')
        .select('*');
      
      if (error) throw error;
      setPortfolioData(data || []);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    }
  };

  const initializeQuarterOptions = () => {
    const options: QuarterOption[] = [];
    let latestQuartersCount = 0;
    
    for (const year of years) {
      // Get available quarters based on actual data
      const availableQuarters = getAvailableQuarters(year, companyData);
      
      for (const quarter of availableQuarters) {
        const isLatestQuarter = latestQuartersCount < 4;
        options.push({
          year,
          quarter,
          label: `Q${quarter} ${year}`,
          value: `${year}-${quarter}`,
          selected: isLatestQuarter
        });
        if (isLatestQuarter) {
          latestQuartersCount++;
        }
      }
    }
    
    setQuarterOptions(options);
  };

  const toggleQuarterSelection = (value: string) => {
    setQuarterOptions(prev => 
      prev.map(option => 
        option.value === value
          ? { ...option, selected: !option.selected }
          : option
      )
    );
  };

  const getSelectedQuarters = () => {
    return quarterOptions
      .filter(option => option.selected)
      .sort((a, b) => b.year - a.year || b.quarter - a.quarter);
  };

  const findLatestPeriod = (): Period | null => {
    if (!fundLevelData) return null;

    for (const year of years) {
      const availableQuarters = getAvailableQuarters(year, fundLevelData);
      for (const quarter of availableQuarters) {
        const hasData = Object.keys(fundLevelData).some(key => {
          if (key.endsWith(`_q${quarter}_${year}`)) {
            const value = fundLevelData[key];
            return value !== null && value !== undefined && value !== 0;
          }
          return false;
        });

        if (hasData) {
          return { year, quarter };
        }
      }
    }

    return { year: 2021, quarter: 1 };
  };

  const fetchFundLevelData = async () => {
    try {
      const { data, error } = await supabase
        .from('fund_level')
        .select('*')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          setFundLevelData(null);
          return;
        }
        throw error;
      }

      setFundLevelData(data);
    } catch (error) {
      console.error('Error fetching fund level data:', error);
    }
  };

  const fetchCompanyData = async () => {
    try {
      const { data, error } = await supabase
        .from('company_data')
        .select('*')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          setCompanyData(null);
          return;
        }
        throw error;
      }

      setCompanyData(data);
    } catch (error) {
      console.error('Error fetching investor data:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return '€' + new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatMillions = (value: number) => {
    return `€${Math.round(value / 1000000)}m`;
  };

  const getQuarterData = (period: Period): QuarterData | null => {
    if (!companyData) return null;
    
    const { year, quarter } = period;
    const paidCapital = companyData[`paid_capital_q${quarter}_${year}`] || 0;
    const nav = companyData[`nav_q${quarter}_${year}`] || 0;
    
    if (paidCapital === 0 && nav === 0) return null;
    
    return {
      quarter,
      year,
      paidCapital,
      nav,
      difference: nav - paidCapital
    };
  };

  const getAllQuartersData = (): ChartData[] => {
    if (!companyData) return [];
    
    const data: ChartData[] = [];
    
    // Start from oldest year (2021) to newest (2025)
    const sortedYears = [...years].reverse();
    
    sortedYears.forEach(year => {
      // For each year, get available quarters based on data
      const availableQuarters = getAvailableQuarters(year, companyData);
      
      // Sort quarters in ascending order for chronological display
      availableQuarters.sort((a, b) => a - b).forEach(quarter => {
        const paidCapital = companyData[`paid_capital_q${quarter}_${year}`] || 0;
        const nav = companyData[`nav_q${quarter}_${year}`] || 0;
        
        if (paidCapital > 0 || nav > 0) {
          data.push({
            name: `Q${quarter} ${year}`,
            paidCapital,
            nav
          });
        }
      });
    });
    
    return data;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const paidCapital = payload.find((p: any) => p.dataKey === 'paidCapital')?.value || 0;
      const nav = payload.find((p: any) => p.dataKey === 'nav')?.value || 0;
      const difference = nav - paidCapital;
      const isPositive = difference > 0;

      return (
        <div className="bg-[#0a1628] p-3 rounded-lg shadow-lg border border-white/10">
          <p className="text-sm font-medium mb-1 text-white">{label}</p>
          <p className="text-sm text-gray-300">
            Paid Capital: {formatCurrency(paidCapital)}
          </p>
          <p className="text-sm text-gray-300">
            NAV: {formatCurrency(nav)}
          </p>
          <p className={`text-sm font-medium mt-1 ${
            isPositive ? 'text-[#6dd8b0]' : 'text-[#FC5858]'
          }`}>
            Gains/(Losses): {formatCurrency(difference)}
          </p>
        </div>
      );
    }
    return null;
  };

  const getValue = (prefix: string) => {
    if (!fundLevelData) return '0';
    const value = fundLevelData[`${prefix}_q${selectedPeriod.quarter}_${selectedPeriod.year}`] || 0;
    
    if (prefix === 'irr') {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (['tvpi', 'moic'].includes(prefix)) {
      return `${Number(value).toFixed(2)}x`;
    }
    if (prefix === 'lp_count') {
      return value.toString();
    }
    if (['management_fee', 'opex'].includes(prefix)) {
      return formatCurrency(Math.abs(value));
    }
    return formatCurrency(value);
  };

  const quarterData = getQuarterData(selectedPeriod);
  const selectedQuarters = getSelectedQuarters();

  return (
    <div className="min-h-screen bg-[#f0f1f3]">
      <nav className="bg-[#0a1628] shadow-lg">
        <div className="mx-auto px-6 sm:px-10 lg:px-16 py-4">
          <div className="grid grid-cols-3 items-center">
            <div>
              <h1 className="text-xl font-semibold text-white">LP Dashboard</h1>
              <p className="text-sm text-gray-400">Welcome, {user?.full_name}</p>
            </div>
            <div className="flex justify-center">
              <img
                src="/w4ltkzoyz3bns38jhlgx3h94zhqg.png"
                alt="e2vc"
                className="h-10 object-contain"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={signOut}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto px-6 sm:px-10 lg:px-16 py-8">
        <div className="space-y-6">
          <FundSummary
            fundLevelData={fundLevelData}
            selectedPeriod={selectedPeriod}
            showPeriodSelector={showPeriodSelector}
            setShowPeriodSelector={setShowPeriodSelector}
            setSelectedPeriod={setSelectedPeriod}
            periodSelectorRef={periodSelectorRef}
            years={years}
            quarters={[]} // Not used anymore, quarters are determined dynamically
            getValue={getValue}
          />

          {companyData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <BasicInfo
                  companyName={companyData.company_name}
                  companyNo={companyData.company_no}
                />
                <Commitment
                  totalCommitment={companyData.total_commitment}
                  formatCurrency={formatCurrency}
                />
                {quarterData && (
                  <QuarterPerformance
                    quarterData={quarterData}
                    formatCurrency={formatCurrency}
                  />
                )}
              </div>

              <AccountDetails
                selectedQuarters={selectedQuarters}
                showQuarterSelector={showQuarterSelector}
                setShowQuarterSelector={setShowQuarterSelector}
                quarterSelectorRef={quarterSelectorRef}
                companyData={companyData}
                formatCurrency={formatCurrency}
              />

              <FinancialOverview
                data={getAllQuartersData()}
                formatMillions={formatMillions}
                CustomTooltip={CustomTooltip}
              />

              <PortfolioOverview
                portfolioData={portfolioData}
                formatCurrency={formatCurrency}
              />
            </>
          ) : (
            <NoInvestor />
          )}

          <UsefulLinks links={usefulLinks} />
        </div>
      </main>
    </div>
  );
}