import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { PlugZap, Power, Menu, X, CircleHelp } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from './FirebaseProvider';

export const Navbar = ({ onHelp, onLogin }: { onHelp?: () => void; onLogin?: () => void }) => {
  const { user, profile, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <PlugZap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">ElectriApp</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/projects" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Proyectos
            </Link>
            <Link to="/electricians" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Electricistas
            </Link>
            <button
              onClick={onHelp}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-1"
            >
              <CircleHelp className="w-4 h-4" /> Ayuda
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-white/20" />
                  <span className="text-sm font-medium text-white">{profile?.displayName || user.displayName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <Power className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-full hover:bg-blue-500 transition-all"
              >
                Iniciar sesión
              </button>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-black border-b border-white/10 p-4 space-y-4"
          >
            <Link to="/projects" onClick={closeMenu} className="block text-lg font-medium text-white">
              Proyectos
            </Link>
            <Link to="/electricians" onClick={closeMenu} className="block text-lg font-medium text-white">
              Electricistas
            </Link>
            <button onClick={onHelp} className="block text-lg font-medium text-white w-full text-left">
              Ayuda
            </button>
            {!user && (
              <button onClick={onLogin} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl">
                Iniciar sesión
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
