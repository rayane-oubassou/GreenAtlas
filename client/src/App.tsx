import React from 'react';
import {
  BrowserRouter as Router, Routes, Route, Navigate,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { UserRole } from './types';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import ReportForm from './pages/ReportForm';
import WaterMonitoring from './pages/WaterMonitoring';
import ForestMonitoring from './pages/ForestMonitoring';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import UsersPage from './pages/UsersPage';
import Leaderboard from './pages/Leaderboard';
import EcosystemPulse from './pages/EcosystemPulse';

const pageVariants = {
  initial: { opacity: 0, y: 14, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0,  filter: 'blur(0px)' },
  exit:    { opacity: 0, y: -8, filter: 'blur(4px)' },
};
const pageTransition = { duration: 0.28, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

/* Lightweight role check — auth check already happened in AppShell */
const RoleGuard: React.FC<{ roles: UserRole[]; children: React.ReactNode }> = ({ roles, children }) => {
  const { user } = useAuth();
  if (user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const PageAnim: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={pageTransition}
  >
    {children}
  </motion.div>
);

/* Single persistent shell — Sidebar and Navbar mount ONCE and never remount */
const AppShell: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <motion.div
          className="w-9 h-9 rounded-full border-[3px] border-primary-600 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/"            element={<PageAnim><Dashboard /></PageAnim>} />
              <Route path="/map"         element={<PageAnim><MapPage /></PageAnim>} />
              <Route path="/report/new"  element={<PageAnim><ReportForm /></PageAnim>} />
              <Route path="/water"       element={<PageAnim><WaterMonitoring /></PageAnim>} />
              <Route path="/forest"      element={<PageAnim><ForestMonitoring /></PageAnim>} />
              <Route path="/profile"     element={<PageAnim><Profile /></PageAnim>} />
              <Route path="/leaderboard" element={<PageAnim><Leaderboard /></PageAnim>} />
              <Route path="/pulse"       element={<PageAnim><EcosystemPulse /></PageAnim>} />
              <Route path="/users"       element={<RoleGuard roles={['admin','agent']}><PageAnim><UsersPage /></PageAnim></RoleGuard>} />
              <Route path="/admin"       element={<RoleGuard roles={['admin']}><PageAnim><AdminDashboard /></PageAnim></RoleGuard>} />
              <Route path="*"            element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

const ToasterConfig: React.FC = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 3500,
      style: { borderRadius: '12px', fontSize: '13px', fontWeight: 500 },
      success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
      error:   { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
    }}
  />
);

const InnerApp: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      {isAuthPage ? (
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      ) : (
        <AppShell />
      )}
      <ToasterConfig />
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <InnerApp />
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
