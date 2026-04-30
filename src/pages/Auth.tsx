import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, KeyRound, Building2, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
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

  return (
    <div className="min-h-screen flex">
      {/* Left panel - dark navy with logo */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#0a1628] flex-col justify-start pt-[2vh] px-8 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] via-[#0a1628]/80 to-[#0a1628]" />
        <div className="relative z-10 flex flex-col">
          <img
            src="/w4ltkzoyz3bns38jhlgx3h94zhqg.png"
            alt="e2vc"
            className="w-full max-w-2xl object-contain mb-10 self-start"
          />
          <div className="text-center">
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

          <h1 className="text-3xl font-bold text-[#0a2547] mb-8 text-center">
            {isSignUp ? 'Sign Up' : 'Sign In'}
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
        </div>
      </div>
    </div>
  );
}
