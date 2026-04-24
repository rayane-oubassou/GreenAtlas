import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
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

const pageVariants = {
  initial: { opacity: 0, y: 18, filter: 'blur(3px)' },
  animate: { opacity: 1, y: 0,  filter: 'blur(0px)' },
  exit:    { opacity: 0, y: -10, filter: 'blur(3px)' },
};

const pageTransition = { duration: 0.32, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
    <Sidebar />
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  </div>
);

const Wrap: React.FC<{ children: React.ReactNode; roles?: ('admin'|'agent'|'citizen')[] }> = ({ children, roles }) => (
  <ProtectedRoute allowedRoles={roles}>
    <AppLayout>
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        {children}
      </motion.div>
    </AppLayout>
  </ProtectedRoute>
);

/* Needs useLocation so must be a child of Router */
const InnerApp: React.FC = () => {
  const location = useLocation();
  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/login"      element={<Login />} />
          <Route path="/register"   element={<Register />} />
          <Route path="/"           element={<Wrap><Dashboard /></Wrap>} />
          <Route path="/map"        element={<Wrap><MapPage /></Wrap>} />
          <Route path="/report/new" element={<Wrap><ReportForm /></Wrap>} />
          <Route path="/water"      element={<Wrap><WaterMonitoring /></Wrap>} />
          <Route path="/forest"     element={<Wrap><ForestMonitoring /></Wrap>} />
          <Route path="/profile"    element={<Wrap><Profile /></Wrap>} />
          <Route path="/users"      element={<Wrap roles={['admin','agent']}><UsersPage /></Wrap>} />
          <Route path="/admin"      element={<Wrap roles={['admin']}><AdminDashboard /></Wrap>} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { borderRadius: '12px', fontSize: '13px', fontWeight: 500 },
          success: { style: { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' } },
          error:   { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' } },
        }}
      />
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
