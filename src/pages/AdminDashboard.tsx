import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { LogOut, ArrowUpDown, Plus, UserCheck, UserX, Ban, Trash2 } from 'lucide-react';
import Logo from '../components/Logo';
import FundSummary from '../components/dashboard/FundSummary';
import UsefulLinks from '../components/dashboard/UsefulLinks';
import LinkDialog from '../components/dashboard/LinkDialog';
import QuarterlyDataManager from '../components/admin/QuarterlyDataManager';
import { useUsefulLinks } from '../hooks/useUsefulLinks';

interface CompanyData {
  id: string;
  company_no: string;
  company_name: string;
  total_commitment: number;
}

interface FundLevelData {
  id: string;
  [key: string]: any;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  role: 'admin' | 'lp';
  is_approved: boolean;
  created_at: string;
  assigned_company_id?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

function getYearsFromData(fundLevelData: FundLevelData | null): number[] {
  if (!fundLevelData) return [2026, 2025, 2024, 2023, 2022, 2021];
  const yearSet = new Set<number>();
  for (const key of Object.keys(fundLevelData)) {
    const match = key.match(/_q\d_(\d{4})$/);
    if (match) yearSet.add(parseInt(match[1], 10));
  }
  if (yearSet.size === 0) return [2026, 2025, 2024, 2023, 2022, 2021];
  return Array.from(yearSet).sort((a, b) => b - a);
}

function findLatestQuarterWithData(fundLevelData: FundLevelData | null): { year: number; quarter: number } {
  if (!fundLevelData) {
    return { year: 2026, quarter: 1 };
  }

  const years = getYearsFromData(fundLevelData);
  const quarters = [4, 3, 2, 1];

  for (const year of years) {
    for (const quarter of quarters) {
      const hasData = Object.keys(fundLevelData).some(key => {
        if (key.endsWith(`_q${quarter}_${year}`)) {
          const value = fundLevelData[key];
          return value !== null && value !== undefined && value !== 0;
        }
        return false;
      });

      if (hasData) {
        return { year, quarter };
      }
    }
  }

  return { year: 2021, quarter: 1 };
}

export default function AdminDashboard() {
  const [companyData, setCompanyData] = useState<CompanyData[]>([]);
  const [fundLevelData, setFundLevelData] = useState<FundLevelData | null>(null);
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [sortField, setSortField] = useState('company_no');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [companyAssignments, setCompanyAssignments] = useState<Record<string, string>>({});
  const [selectedPeriod, setSelectedPeriod] = useState<{ year: number; quarter: number } | null>(null);
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const periodSelectorRef = useRef<HTMLDivElement>(null);
  const signOut = useAuthStore((state) => state.signOut);
  const { 
    links: usefulLinks, 
    addLink, 
    updateLink, 
    deleteLink,
    reorderLinks 
  } = useUsefulLinks();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodSelectorRef.current && !periodSelectorRef.current.contains(event.target as Node)) {
        setShowPeriodSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchCompanyData(),
          fetchPendingUsers(),
          fetchCompanyAssignments(),
          fetchFundLevelData()
        ]);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchCompanyData();
    }
  }, [sortField, sortDirection]);

  useEffect(() => {
    if (fundLevelData) {
      setSelectedPeriod(findLatestQuarterWithData(fundLevelData));
    }
  }, [fundLevelData]);

  const fetchFundLevelData = async () => {
    try {
      const { data, error } = await retryOperation(() => 
        supabase
          .from('fund_level')
          .select('*')
          .single()
      );
      
      if (error) {
        if (error.code === 'PGRST116') {
          const { data: newData, error: createError } = await retryOperation(() =>
            supabase
              .from('fund_level')
              .insert([{}])
              .select()
              .single()
          );
          
          if (createError) throw createError;
          setFundLevelData(newData);
        } else {
          throw error;
        }
      } else {
        setFundLevelData(data);
      }
    } catch (error) {
      console.error('Error fetching fund level data:', error);
      throw error;
    }
  };

  const fetchCompanyAssignments = async () => {
    try {
      const { data, error } = await retryOperation(() =>
        supabase
          .from('profiles')
          .select('id, assigned_company_id')
      );
      
      if (error) throw error;
      
      const assignments = (data || []).reduce((acc, curr) => ({
        ...acc,
        [curr.id]: curr.assigned_company_id
      }), {});
      
      setCompanyAssignments(assignments);
    } catch (error) {
      console.error('Error fetching company assignments:', error);
      throw error;
    }
  };

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await retryOperation(() =>
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'lp')
          .neq('status', 'rejected')
          .order('created_at', { ascending: false })
      );
      
      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      throw error;
    }
  };

  const handleApproval = async (userId: string, approve: boolean) => {
    try {
      const { error } = await retryOperation(() =>
        supabase
          .from('profiles')
          .update({ 
            is_approved: approve,
            status: approve ? 'approved' : 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      );
      
      if (error) throw error;
      
      setPendingUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, is_approved: approve, status: approve ? 'approved' : 'pending' } : user
        )
      );
      
      await Promise.all([
        fetchPendingUsers(),
        fetchCompanyAssignments()
      ]);
    } catch (error) {
      console.error('Error in approval process:', error);
      alert('Failed to update user approval status. Please try again.');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      const { error: profileError } = await retryOperation(() =>
        supabase
          .from('profiles')
          .update({ 
            is_approved: false,
            status: 'rejected',
            assigned_company_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      );
      
      if (profileError) throw profileError;
      
      setPendingUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? {
            ...user,
            is_approved: false,
            status: 'rejected',
            assigned_company_id: null
          } : user
        )
      );
      
      setCompanyAssignments(prev => {
        const newAssignments = { ...prev };
        delete newAssignments[userId];
        return newAssignments;
      });
      
      await Promise.all([
        fetchPendingUsers(),
        fetchCompanyAssignments()
      ]);
    } catch (error) {
      console.error('Error in rejection process:', error);
      alert('Failed to reject user. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await retryOperation(() =>
        supabase
          .from('profiles')
          .delete()
          .eq('id', userId)
      );

      if (error) throw error;

      setPendingUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      setCompanyAssignments(prev => {
        const newAssignments = { ...prev };
        delete newAssignments[userId];
        return newAssignments;
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleCompanyAssignment = async (userId: string, companyId: string) => {
    try {
      const { error } = await retryOperation(() =>
        supabase
          .from('profiles')
          .update({ 
            assigned_company_id: companyId || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      );
      
      if (error) throw error;
      
      setCompanyAssignments(prev => ({
        ...prev,
        [userId]: companyId
      }));
      
      setPendingUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, assigned_company_id: companyId } : user
        )
      );
    } catch (error) {
      console.error('Error in company assignment:', error);
      alert('Failed to assign company. Please try again.');
    }
  };

  const fetchCompanyData = async () => {
    try {
      const { data, error } = await retryOperation(() =>
        supabase
          .from('company_data')
          .select('id, company_no, company_name, total_commitment')
          .order(sortField, { ascending: sortDirection === 'asc' })
      );
      
      if (error) throw error;
      setCompanyData(data || []);
    } catch (error) {
      console.error('Error fetching company data:', error);
      throw error;
    }
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (value: number) => {
    return '€ ' + new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getValue = (prefix: string) => {
    if (!fundLevelData || !selectedPeriod) return '0';
    const value = fundLevelData[`${prefix}_q${selectedPeriod.quarter}_${selectedPeriod.year}`] || 0;
    
    if (prefix === 'irr') {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (['tvpi', 'moic'].includes(prefix)) {
      return `${Number(value).toFixed(2)}x`;
    }
    if (prefix === 'lp_count') {
      return value.toString();
    }
    if (['management_fee', 'opex'].includes(prefix)) {
      return formatCurrency(Math.abs(value));
    }
    return formatCurrency(value);
  };

  const handleSaveLink = async (linkData: any) => {
    try {
      if (editingLink) {
        await updateLink(editingLink.id, linkData);
      } else {
        await addLink(linkData);
      }
      setShowLinkDialog(false);
      setEditingLink(null);
    } catch (error) {
      console.error('Error saving link:', error);
      alert('Failed to save link. Please try again.');
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    try {
      await deleteLink(id);
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('Failed to delete link. Please try again.');
    }
  };

  const SortableHeader: React.FC<{ field: string; label: string }> = ({ field, label }) => (
    <th 
      className="px-4 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    </th>
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const years = getYearsFromData(fundLevelData);
  const quarters = [4, 3, 2, 1];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#0a2547] text-white px-4 py-2 rounded hover:bg-[#1a365d]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-3 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-[#0a2547] pl-0">Admin Dashboard</h1>
            </div>
            <div className="flex justify-center">
              <Logo />
            </div>
            <div className="flex justify-end">
              <button
                onClick={signOut}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <FundSummary
          fundLevelData={fundLevelData}
          selectedPeriod={selectedPeriod || undefined}
          showPeriodSelector={showPeriodSelector}
          setShowPeriodSelector={setShowPeriodSelector}
          setSelectedPeriod={setSelectedPeriod}
          periodSelectorRef={periodSelectorRef}
          years={years}
          quarters={quarters}
          getValue={getValue}
        />

        <QuarterlyDataManager onDataSaved={() => fetchFundLevelData()} />

        <UsefulLinks
          links={usefulLinks}
          isAdmin={true}
          onAdd={() => {
            setEditingLink(null);
            setShowLinkDialog(true);
          }}
          onEdit={(link) => {
            setEditingLink(link);
            setShowLinkDialog(true);
          }}
          onDelete={handleDeleteLink}
          onReorder={reorderLinks}
        />

        {/* User Management Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">User Management</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 bg-gray-50">Full Name</th>
                    <th className="px-4 py-2 bg-gray-50">Email</th>
                    <th className="px-4 py-2 bg-gray-50">Company</th>
                    <th className="px-4 py-2 bg-gray-50">Status</th>
                    <th className="px-4 py-2 bg-gray-50">Assigned Company</th>
                    <th className="px-4 py-2 bg-gray-50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{user.full_name}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.company_name}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getStatusBadgeClass(user.status || (user.is_approved ? 'approved' : 'pending'))
                        }`}>
                          {user.status || (user.is_approved ? 'Approved' : 'Pending')}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={companyAssignments[user.id] || ''}
                          onChange={(e) => handleCompanyAssignment(user.id, e.target.value)}
                          disabled={user.status === 'rejected'}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#0a2547] focus:border-[#0a2547] sm:text-sm rounded-md disabled:bg-gray-100 disabled:text-gray-500"
                        >
                          <option value="">Select Company...</option>
                          {companyData.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.company_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex space-x-2">
                          {user.status !== 'rejected' && (
                            <>
                              {!user.is_approved && (
                                <button
                                  onClick={() => handleApproval(user.id, true)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Approve User"
                                >
                                  <UserCheck className="h-5 w-5" />
                                </button>
                              )}
                              {user.is_approved && (
                                <button
                                  onClick={() => handleApproval(user.id, false)}
                                  className="text-yellow-600 hover:text-yellow-900"
                                  title="Revoke Approval"
                                >
                                  <UserX className="h-5 w-5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleReject(user.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Reject User"
                              >
                                <Ban className="h-5 w-5" />
                              </button>
                            </>
                          )}
                          {user.status === 'rejected' && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendingUsers.length === 0 && (
                <p className="text-center text-gray-500 py-4">No users to manage</p>
              )}
            </div>
          </div>
        </div>

        {/* Company Data Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Company Data</h2>
              <button className="flex items-center px-4 py-2 bg-[#0a2547] text-white rounded-md hover:bg-[#1a365d]">
                <Plus className="h-5 w-5 mr-2" />
                Add Company
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <SortableHeader field="company_no" label="Company No" />
                    <SortableHeader field="company_name" label="Company Name" />
                    <SortableHeader field="total_commitment" label="Total Commitment" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {companyData.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap">{company.company_no}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{company.company_name}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {formatCurrency(company.total_commitment)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {companyData.length === 0 && (
                <p className="text-center text-gray-500 py-4">No companies to display</p>
              )}
            </div>
          </div>
        </div>

        {showLinkDialog && (
          <LinkDialog
            isOpen={showLinkDialog}
            onClose={() => {
              setShowLinkDialog(false);
              setEditingLink(null);
            }}
            onSave={handleSaveLink}
            initialData={editingLink}
          />
        )}
      </main>
    </div>
  );
}