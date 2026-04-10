import React from 'react';
import { BarChart } from 'lucide-react';

interface QuarterPerformanceProps {
  quarterData: {
    quarter: number;
    year: number;
    paidCapital: number;
    nav: number;
    difference: number;
  };
  formatCurrency: (value: number) => string;
}

export default function QuarterPerformance({ quarterData, formatCurrency }: QuarterPerformanceProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-5 bg-purple-50 border-b border-purple-100">
        <div className="flex items-center">
          <BarChart className="h-6 w-6 text-purple-600" />
          <h3 className="ml-2 text-lg font-semibold text-purple-900">
            Q{quarterData.quarter} {quarterData.year} Performance
          </h3>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Paid Capital</h3>
            <p className="text-2xl font-bold text-[#0a2547]">
              {formatCurrency(quarterData.paidCapital)}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">NAV</h3>
            <p className="text-2xl font-bold text-[#0a2547]">
              {formatCurrency(quarterData.nav)}
            </p>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Gains/(Losses)</h3>
          <p className={`text-2xl font-bold ${
            quarterData.difference >= 0 ? 'text-[#27E4A5]' : 'text-[#FC5858]'
          }`}>
            {formatCurrency(quarterData.difference)}
          </p>
        </div>
      </div>
    </div>
  );
}