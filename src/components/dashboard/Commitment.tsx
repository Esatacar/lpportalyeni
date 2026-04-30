import React from 'react';
import { Wallet } from 'lucide-react';

interface CommitmentProps {
  totalCommitment: number;
  formatCurrency: (value: number) => string;
}

export default function Commitment({ totalCommitment, formatCurrency }: CommitmentProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 bg-[#0a1628]">
        <div className="flex items-center">
          <Wallet className="h-6 w-6 text-[#6dd8b0]" />
          <h3 className="ml-2 text-lg font-semibold text-white">Total Commitment</h3>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Committed Investment</h3>
        <p className="text-xl font-bold text-[#0a2547]">
          {formatCurrency(totalCommitment)}
        </p>
      </div>
    </div>
  );
}