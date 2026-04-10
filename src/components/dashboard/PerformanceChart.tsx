import React from 'react';
import { LineChart as LineChartIcon } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface PerformanceChartProps {
  data: Array<{
    name: string;
    tvpi: number;
    irr: number;
  }>;
  formatPercentage: (value: number) => string;
  PerformanceTooltip: React.FC<any>;
}

export default function PerformanceChart({ 
  data, 
  formatPercentage, 
  PerformanceTooltip 
}: PerformanceChartProps) {
  return (
    <div className="mt-8">
      <div className="flex items-center mb-4">
        <LineChartIcon className="h-6 w-6 text-indigo-600 mr-2" />
        <h4 className="text-lg font-semibold text-gray-900">Performance Metrics</h4>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
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
              stroke="#27E4A5" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}