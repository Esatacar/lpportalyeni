import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, KeyRound, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

type ViewMode = 'auth' | 'forgot-email' | 'forgot-code' | 'forgot-newpass';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewMode>('auth');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
  });

  const [resetData, setResetData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password, {
          full_name: formData.fullName,
          company_name: formData.companyName,
        });

        setSuccess(`Thank you for registering! Your account has been created successfully.

We will review your registration and notify you via email (${formData.email}) once your account is approved.

In the meantime, you can sign in to check your approval status.`);

        setFormData({
          email: '',
          password: '',
          fullName: '',
          companyName: '',
        });
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
    } catch (error: any) {
      setError(error.message === 'Invalid login credentials'
        ? 'Incorrect email or password. Please try again.'
        : error.message
      );
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forgot-password`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email: resetData.email }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reset code');
      }

      setView('forgot-code');
      setSuccess('A 6-digit reset code has been sent to your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (resetData.code.length !== 6) {
      setError('Please enter the 6-digit code from your email.');
      return;
    }

    setSuccess('');
    setView('forgot-newpass');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (resetData.newPassword !== resetData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (resetData.newPassword.length < 12) {
      setError('Password must be at least 12 characters.');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/forgot-password`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          email: resetData.email,
          new_password: resetData.newPassword,
          code: resetData.code,
          type: 'reset',
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password');
      }

      setSuccess('Your password has been reset successfully. You can now sign in with your new password.');
      setResetData({ email: '', code: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setView('auth');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goBackToLogin = () => {
    setView('auth');
    setError('');
    setSuccess('');
    setResetData({ email: '', code: '', newPassword: '', confirmPassword: '' });
  };

  const renderForgotPassword = () => {
    if (view === 'forgot-email') {
      return (
        <form onSubmit={handleSendResetCode} className="space-y-5">
          <div>
            <input
              type="email"
              placeholder="Enter your email address"
              value={resetData.email}
              onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
              className="w-full px-5 py-3.5 border border-gray-300 rounded-full bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-[#6dd8b0] text-[#0a2547] font-semibold text-base hover:bg-[#5cc9a0] transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            Send Reset Code
          </button>
        </form>
      );
    }

    if (view === 'forgot-code') {
      return (
        <form onSubmit={handleVerifyCode} className="space-y-5">
          <div>
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={resetData.code}
              onChange={(e) => setResetData({ ...resetData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              className="w-full px-5 py-3.5 border border-gray-300 rounded-full bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none transition-colors text-center text-lg tracking-[0.5em]"
              required
            />
          </div>
          <p className="text-xs text-gray-500 text-center">Check your email for the 6-digit code</p>

          <button
            type="submit"
            className="w-full py-4 rounded-full bg-[#6dd8b0] text-[#0a2547] font-semibold text-base hover:bg-[#5cc9a0] transition-colors shadow-sm"
          >
            Verify Code
          </button>
        </form>
      );
    }

    if (view === 'forgot-newpass') {
      return (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              value={resetData.newPassword}
              onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
              className="w-full px-5 py-3.5 border border-gray-300 rounded-full bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none transition-colors pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm New Password"
              value={resetData.confirmPassword}
              onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
              className="w-full px-5 py-3.5 border border-gray-300 rounded-full bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-[#6dd8b0] text-[#0a2547] font-semibold text-base hover:bg-[#5cc9a0] transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
            Reset Password
          </button>
        </form>
      );
    }

    return null;
  };

  const getForgotTitle = () => {
    if (view === 'forgot-email') return 'Forgot Password';
    if (view === 'forgot-code') return 'Enter Code';
    if (view === 'forgot-newpass') return 'New Password';
    return '';
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - dark navy with logo */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0a1628] flex-col items-center justify-start px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0a1628]/80 to-[#0a1628]" />
        <div className="relative z-10 flex flex-col items-center w-full -mt-[8%]">
          <img
            src="/w4ltkzoyz3bns38jhlgx3h94zhqg.png"
            alt="e2vc"
            className="w-full max-w-2xl object-contain"
            style={{ display: 'block', maxHeight: 'none', height: 'auto' }}
          />
          <div className="text-center -mt-10">
            <p className="text-[#6dd8b0] text-3xl font-semibold tracking-[0.3em] uppercase mb-3">Investor Portal</p>
            <h2 className="text-white text-5xl font-bold tracking-tight">Fund II</h2>
          </div>
        </div>
      </div>

      {/* Right panel - light gray with form */}
      <div className="flex-1 bg-[#f0f1f3] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <img
              src="/w4ltkzoyz3bns38jhlgx3h94zhqg.png"
              alt="e2vc"
              className="h-14"
            />
          </div>

          {view !== 'auth' && (
            <button
              onClick={goBackToLogin}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0a2547] transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </button>
          )}

          <h1 className="text-3xl font-bold text-[#0a2547] mb-8 text-center">
            {view === 'auth' ? (isSignUp ? 'Sign Up' : 'Sign In') : getForgotTitle()}
          </h1>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-500 shrink-0" />
                <p className="text-sm whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-800 border border-green-200">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm whitespace-pre-line">{success}</p>
              </div>
            </div>
          )}

          {view === 'auth' ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-3.5 border border-gray-300 rounded-full bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none transition-colors"
                    required
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-5 py-3.5 border border-gray-300 rounded-full bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none transition-colors pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {isSignUp && (
                  <>
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-5 py-3.5 border border-gray-300 rounded-full bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Company Name"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full px-5 py-3.5 border border-gray-300 rounded-full bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#0a2547] focus:ring-1 focus:ring-[#0a2547] outline-none transition-colors"
                        required
                      />
                    </div>
                  </>
                )}

                {!isSignUp && (
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-[#0a2547]" />
                    <button
                      type="button"
                      onClick={() => { setView('forgot-email'); setError(''); setSuccess(''); }}
                      className="text-sm font-medium text-[#0a2547] hover:underline"
                    >
                      Forgot Password
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 rounded-full bg-[#6dd8b0] text-[#0a2547] font-semibold text-base hover:bg-[#5cc9a0] transition-colors shadow-sm"
                >
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                {isSignUp ? (
                  <>
                    Already have an account?{' '}
                    <button
                      onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }}
                      className="font-medium text-[#0a2547] underline hover:text-[#1a365d]"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account yet?{' '}
                    <button
                      onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }}
                      className="font-medium text-[#0a2547] underline hover:text-[#1a365d]"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </p>
            </>
          ) : (
            renderForgotPassword()
          )}
        </div>
      </div>
    </div>
  );
}
