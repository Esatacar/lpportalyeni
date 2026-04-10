import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Lock, Mail, Building2, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, checkAdmin } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
    adminCode: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (isSignUp) {
        if (isAdmin && !checkAdmin(formData.adminCode)) {
          setError('Invalid admin verification code');
          return;
        }
        
        await signUp(formData.email, formData.password, {
          full_name: formData.fullName,
          company_name: formData.companyName,
          role: isAdmin ? 'admin' : 'lp',
        });
        
        if (isAdmin) {
          navigate('/admin');
        } else {
          setSuccess(`Thank you for registering! Your account has been created successfully.

We will review your registration and notify you via email (${formData.email}) once your account is approved.

In the meantime, you can sign in to check your approval status.`);
          
          // Clear form
          setFormData({
            email: '',
            password: '',
            fullName: '',
            companyName: '',
            adminCode: '',
          });
        }
      } else {
        const user = await signIn(formData.email, formData.password);
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'lp') {
          if (user.is_approved) {
            navigate('/dashboard');
          } else {
            setError('Your account is pending approval. We will notify you via email once approved.');
          }
        }
      }
    } catch (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Incorrect email or password. Please try again.'
        : error.message
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size="large" />
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => {
              setIsAdmin(!isAdmin);
              setError('');
              setSuccess('');
            }}
            className="text-sm text-[#0a2547] hover:text-[#1a365d]"
          >
            {isAdmin ? 'Switch to LP' : 'Switch to Admin'}
          </button>
        </div>

        {/* Sign In/Sign Up Toggle */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => {
              setIsSignUp(false);
              setError('');
              setSuccess('');
              setFormData({
                email: '',
                password: '',
                fullName: '',
                companyName: '',
                adminCode: '',
              });
            }}
            className={`flex-1 py-2 px-4 rounded-md text-center transition-colors ${
              !isSignUp 
                ? 'bg-[#0a2547] text-white' 
                : 'bg-gray-100 text-[#0a2547] hover:bg-gray-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setIsSignUp(true);
              setError('');
              setSuccess('');
              setFormData({
                email: '',
                password: '',
                fullName: '',
                companyName: '',
                adminCode: '',
              });
            }}
            className={`flex-1 py-2 px-4 rounded-md text-center transition-colors ${
              isSignUp 
                ? 'bg-[#0a2547] text-white' 
                : 'bg-gray-100 text-[#0a2547] hover:bg-gray-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        <h1 className="text-2xl font-bold text-[#0a2547] mb-6 text-center">
          {isSignUp 
            ? 'Create Account' 
            : (isAdmin ? 'Admin Panel' : 'LP Portal')}
        </h1>

        {error && (
          <div className="mb-4 p-4 rounded-md bg-red-50 text-red-800 border border-red-200">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              <p className="text-sm whitespace-pre-line">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-md bg-green-50 text-green-800 border border-green-200">
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 mt-0.5" />
              <p className="text-sm whitespace-pre-line">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-10 w-full p-2 border rounded-md focus:ring-[#0a2547] focus:border-[#0a2547]"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-10 w-full p-2 border rounded-md focus:ring-[#0a2547] focus:border-[#0a2547]"
                required
              />
            </div>
          </div>

          {isSignUp && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="pl-10 w-full p-2 border rounded-md focus:ring-[#0a2547] focus:border-[#0a2547]"
                    required
                  />
                </div>
              </div>

              {!isAdmin && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="pl-10 w-full p-2 border rounded-md focus:ring-[#0a2547] focus:border-[#0a2547]"
                      required
                    />
                  </div>
                </div>
              )}

              {isAdmin && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Admin Verification Code</label>
                  <input
                    type="text"
                    value={formData.adminCode}
                    onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
                    className="w-full p-2 border rounded-md focus:ring-[#0a2547] focus:border-[#0a2547]"
                    required
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            className="w-full bg-[#0a2547] text-white py-3 px-4 rounded-md hover:bg-[#1a365d] transition-colors font-medium text-lg"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}