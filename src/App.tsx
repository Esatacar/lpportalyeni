import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useAuthSecurity } from './hooks/useAuthSecurity';
import { supabase } from './lib/supabase';

// Lazy load pages
const Auth = React.lazy(() => import('./pages/Auth'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const LPDashboard = React.lazy(() => import('./pages/LPDashboard'));

// Loading component with fade transition
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center animate-fadeIn">
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuthStore();
  const [validating, setValidating] = React.useState(true);

  React.useEffect(() => {
    const validateSession = async () => {
      if (!user) {
        setValidating(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        signOut();
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !profile) {
        signOut();
        return;
      }

      setValidating(false);
    };

    validateSession();
  }, [user, signOut]);

  if (validating) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (user.role === 'lp' && !user.is_approved) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
          <p>Your account is pending admin approval. Please check back later.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function App() {
  const { initializeAuth, setLoading } = useAuthStore();
  useAuthSecurity();

  useEffect(() => {
    initializeAuth().finally(() => setLoading(false));
  }, [initializeAuth, setLoading]);

  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <LPDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/auth" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;