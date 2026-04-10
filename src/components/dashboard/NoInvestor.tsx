import React from 'react';
import { Building2 } from 'lucide-react';

export default function NoInvestor() {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6 text-center">
        <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Investor Assigned</h3>
        <p className="text-gray-600">
          You haven't been assigned to an investor yet. Please contact your administrator.
        </p>
      </div>
    </div>
  );
}