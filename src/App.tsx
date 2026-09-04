import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useAuthSecurity } from './hooks/useAuthSecurity';
import Auth from './pages/Auth';

// Lazy load pages that require authentication
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

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, loading } = useAuthStore();

  if (loading) {
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

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
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
              <ProtectedRoute adminOnly>
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