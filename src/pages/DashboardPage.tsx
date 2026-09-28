import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { useAuth } from '../components/FirebaseProvider';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { HelpCenter } from '../components/HelpCenter';
import { LoginModal } from '../components/LoginModal';
import { ProfileSetup } from '../components/ProfileSetup';
import { ElectricianDashboard } from '../components/ElectricianDashboard';
import { ClientDashboard } from '../components/ClientDashboard';
import { ElectricianProfile } from '../components/ElectricianProfile';
import { ChatWindow } from '../components/ChatWindow';
import { useCompleteProject } from '../hooks/useCompleteProject';
import { Project, PublicProfile } from '../types';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const handleCompleteProject = useCompleteProject();

  const [viewingElectrician, setViewingElectrician] = useState<PublicProfile | null>(null);
  const [chatProject, setChatProject] = useState<Project | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const clientTab = location.pathname.startsWith('/electricians') ? 'search' : 'projects';

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (!profile) {
    return (
      <>
        <ProfileSetup onHelp={() => setShowHelp(true)} />
        <AnimatePresence>{showHelp && <HelpCenter onClose={() => setShowHelp(false)} />}</AnimatePresence>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar onHelp={() => setShowHelp(true)} onLogin={() => setShowLogin(true)} />

      {profile.role === 'electrician' ? (
        <ElectricianDashboard onChat={(p) => setChatProject(p)} onComplete={handleCompleteProject} />
      ) : (
        <ClientDashboard
          initialTab={clientTab}
          onChat={(p) => setChatProject(p)}
          onViewElectrician={(e) => setViewingElectrician(e)}
          onComplete={handleCompleteProject}
        />
      )}

      <Footer onHelp={() => setShowHelp(true)} />

      <AnimatePresence>
        {showHelp && <HelpCenter onClose={() => setShowHelp(false)} />}
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
        {viewingElectrician && (
          <ElectricianProfile electrician={viewingElectrician} onClose={() => setViewingElectrician(null)} />
        )}
        {chatProject && (
          <ChatWindow project={chatProject} currentUser={profile} onClose={() => setChatProject(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
