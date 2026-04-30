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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 bg-[#0a1628]">
        <div className="flex items-center">
          <BarChart className="h-6 w-6 text-[#6dd8b0]" />
          <h3 className="ml-2 text-lg font-semibold text-white">
            Q{quarterData.quarter} {quarterData.year} Performance
          </h3>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Paid Capital</h3>
            <p className="text-xl font-bold text-[#0a2547]">
              {formatCurrency(quarterData.paidCapital)}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">NAV</h3>
            <p className="text-xl font-bold text-[#0a2547]">
              {formatCurrency(quarterData.nav)}
            </p>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Gains/(Losses)</h3>
          <p className={`text-xl font-bold ${
            quarterData.difference >= 0 ? 'text-[#27E4A5]' : 'text-[#FC5858]'
          }`}>
            {formatCurrency(quarterData.difference)}
          </p>
        </div>
      </div>
    </div>
  );
}