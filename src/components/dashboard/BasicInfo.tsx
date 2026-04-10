import React from 'react';
import { Building2 } from 'lucide-react';

interface BasicInfoProps {
  companyName: string;
  companyNo: string;
}

export default function BasicInfo({ companyName, companyNo }: BasicInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-5 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center">
          <Building2 className="h-6 w-6 text-blue-600" />
          <h3 className="ml-2 text-lg font-semibold text-blue-900">Basic Information</h3>
        </div>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Investor Name</h3>
          <p className="text-2xl font-bold text-[#0a2547]">{companyName}</p>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Investor ID</h3>
          <p className="text-2xl font-bold text-[#0a2547]">{companyNo}</p>
        </div>
      </div>
    </div>
  );
}