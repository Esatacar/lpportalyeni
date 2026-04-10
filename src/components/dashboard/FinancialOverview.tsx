import React from 'react';
import { TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface FinancialOverviewProps {
  data: Array<{
    name: string;
    paidCapital: number;
    nav: number;
  }>;
  formatMillions: (value: number) => string;
  CustomTooltip: React.FC<any>;
}

export default function FinancialOverview({ data, formatMillions, CustomTooltip }: FinancialOverviewProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">LP Financial Overview</h2>
        </div>
        <div className="h-[600px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              barSize={60}
            >
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={70}
                interval={0}
                tick={{ fill: '#4B5563' }}
              />
              <YAxis 
                tickFormatter={(value) => `€${(value / 1000000).toFixed(1)}m`}
                tick={{ fill: '#4B5563' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar 
                dataKey="paidCapital" 
                name="Paid Capital" 
                fill="#60CFAE" 
              />
              <Bar 
                dataKey="nav" 
                name="NAV" 
                fill="#0a2547" 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}