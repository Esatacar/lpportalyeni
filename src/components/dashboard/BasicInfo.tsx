import React from 'react';
import { Building2 } from 'lucide-react';

interface BasicInfoProps {
  companyName: string;
  companyNo: string;
}

export default function BasicInfo({ companyName, companyNo }: BasicInfoProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 bg-[#0a1628]">
        <div className="flex items-center">
          <Building2 className="h-6 w-6 text-[#6dd8b0]" />
          <h3 className="ml-2 text-lg font-semibold text-white">Basic Information</h3>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Investor Name</h3>
          <p className="text-xl font-bold text-[#0a2547]">{companyName}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Investor ID</h3>
          <p className="text-xl font-bold text-[#0a2547]">{companyNo}</p>
        </div>
      </div>
    </div>
  );
}