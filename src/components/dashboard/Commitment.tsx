import React from 'react';
import { Wallet } from 'lucide-react';

interface CommitmentProps {
  totalCommitment: number;
  formatCurrency: (value: number) => string;
}

export default function Commitment({ totalCommitment, formatCurrency }: CommitmentProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-5 bg-emerald-50 border-b border-emerald-100">
        <div className="flex items-center">
          <Wallet className="h-6 w-6 text-emerald-600" />
          <h3 className="ml-2 text-lg font-semibold text-emerald-900">Total Commitment</h3>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Committed Investment</h3>
        <p className="text-2xl font-bold text-[#0a2547]">
          {formatCurrency(totalCommitment)}
        </p>
      </div>
    </div>
  );
}