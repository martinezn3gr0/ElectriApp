import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { FirebaseProvider, ErrorBoundary, useAuth } from './components/FirebaseProvider';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import PrivacyPage from './pages/PrivacyPage';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { HelpCenter } from './components/HelpCenter';
import { LoginModal } from './components/LoginModal';

function HomeRoute() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && profile) {
    return <Navigate to="/projects" replace />;
  }

  if (user && !profile) {
    return <Navigate to="/projects" replace />;
  }

  return <LandingPage />;
}

function PrivacyRoute() {
  const [showHelp, setShowHelp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-black">
      <Navbar onHelp={() => setShowHelp(true)} onLogin={() => setShowLogin(true)} />
      <PrivacyPage />
      <Footer onHelp={() => setShowHelp(true)} />
      <AnimatePresence>
        {showHelp && <HelpCenter onClose={() => setShowHelp(false)} />}
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </AnimatePresence>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/projects" element={<DashboardPage />} />
      <Route path="/electricians" element={<DashboardPage />} />
      <Route path="/privacy" element={<PrivacyRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <FirebaseProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </FirebaseProvider>
    </BrowserRouter>
  );
}
