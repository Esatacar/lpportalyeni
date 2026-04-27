import React, { useState } from 'react';
import { BarChart3, Building2, Briefcase } from 'lucide-react';
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

export default function QuarterlyDataManager({ onDataSaved }: QuarterlyDataManagerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('fund');

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 pt-5 sm:px-6">
        <h2 className="text-lg font-medium text-gray-900">Quarterly Data Entry</h2>
        <p className="text-sm text-gray-500 mt-1">
          Enter and manage fund, LP, and portfolio data by quarter
        </p>
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
        {activeTab === 'fund' && <FundLevelDataEntry onDataSaved={onDataSaved} />}
        {activeTab === 'lp' && <LPDataEntry onDataSaved={onDataSaved} />}
        {activeTab === 'portfolio' && <PortfolioDataEntry onDataSaved={onDataSaved} />}
      </div>
    </div>
  );
}
