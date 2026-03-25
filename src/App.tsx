import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Search, 
  Plus, 
  User, 
  LogOut, 
  Briefcase, 
  CheckCircle, 
  Clock, 
  MapPin, 
  DollarSign, 
  Star, 
  Shield, 
  TrendingUp, 
  Award,
  Menu,
  X,
  ChevronRight,
  ArrowRight,
  MessageSquare,
  Send,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  setDoc, 
  orderBy,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

import { auth, db, googleProvider } from './firebase';
import { FirebaseProvider, useAuth, handleFirestoreError, OperationType, ErrorBoundary } from './components/FirebaseProvider';
import { UserProfile, Project, ProjectStatus, ProjectCategory, UserRole, Review, Message } from './types';
import { cn } from './lib/utils';

// --- Components ---

const Navbar = ({ onHelp }: { onHelp?: () => void }) => {
  const { user, profile, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">ElectriApp</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Proyectos</a>
            <a href="#" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Electricistas</a>
            <button 
              onClick={onHelp}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-4 h-4" /> Ayuda
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
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-black border-b border-white/10 p-4 space-y-4"
          >
            <a href="#" className="block text-lg font-medium text-white">Proyectos</a>
            <a href="#" className="block text-lg font-medium text-white">Electricistas</a>
            <button 
              onClick={onHelp}
              className="block text-lg font-medium text-white w-full text-left"
            >
              Ayuda
            </button>
            {!user && (
              <button 
                onClick={handleLogin}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl"
              >
                Iniciar sesión
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const HelpCenter = ({ onClose }: { onClose: () => void }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-zinc-900 rounded-[2.5rem] border border-white/10 p-10 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8">
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-600/20">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase italic">Centro de Ayuda</h2>
          <p className="text-white/50 text-lg">¿Cómo podemos ayudarte hoy?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { 
              title: "Soy Electricista", 
              desc: "Aprende cómo encontrar proyectos, comunicarte con clientes y recibir pagos.",
              icon: Zap,
              color: "bg-blue-600"
            },
            { 
              title: "Soy Cliente", 
              desc: "Descubre cómo publicar proyectos, filtrar electricistas y gestionar contratos.",
              icon: Briefcase,
              color: "bg-purple-600"
            },
            { 
              title: "Seguridad y Pagos", 
              desc: "Información sobre nuestras políticas de seguridad y métodos de pago protegidos.",
              icon: Shield,
              color: "bg-green-600"
            },
            { 
              title: "Soporte Técnico", 
              desc: "Contacta con nuestro equipo si tienes problemas con la plataforma.",
              icon: MessageSquare,
              color: "bg-orange-600"
            }
          ].map((item, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02, y: -5 }}
              className="p-6 bg-white/5 rounded-3xl border border-white/10 text-left group hover:border-white/20 transition-all"
            >
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", item.color)}>
                <item.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
            </motion.button>
          ))}
        </div>

        <div className="mt-10 pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1,2,3].map(i => (
                <img key={i} src={`https://picsum.photos/seed/user${i}/100/100`} className="w-10 h-10 rounded-full border-2 border-zinc-900" alt="" />
              ))}
            </div>
            <p className="text-sm text-white/40 font-bold">Nuestro equipo está en línea</p>
          </div>
          <button className="w-full sm:w-auto px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all">
            CHATEAR CON SOPORTE
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Hero = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-black">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-blue-600 uppercase bg-blue-600/10 rounded-full border border-blue-600/20">
            El futuro de la contratación eléctrica
          </span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-8 leading-[0.9]">
            IMPULSANDO TUS <br />
            <span className="text-blue-600 italic">PROYECTOS MÁS GRANDES</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-white/60 mb-10">
            ElectriApp es el mercado de élite donde los mejores electricistas encuentran proyectos comerciales y residenciales de alto valor. Olvídate de buscar clientes: solo contratos reales.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              Buscar proyectos <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={onLogin}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
            >
              Publicar un trabajo
            </button>
          </div>
        </motion.div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            { icon: Shield, title: "Profesionales verificados", desc: "Cada electricista es verificado y cuenta con licencia comprobada." },
            { icon: TrendingUp, title: "Clientes de alto valor", desc: "Enfócate en proyectos comerciales, industriales y residenciales de gran escala." },
            { icon: Award, title: "Red de élite", desc: "Únete al 5% superior de contratistas eléctricos en tu región." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm"
            >
              <feature.icon className="w-10 h-10 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ProfileSetup = ({ onHelp }: { onHelp: () => void }) => {
  const { user, setProfile } = useAuth();
  const [role, setRole] = useState<UserRole>('electrician');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!acceptedTerms) {
      alert("Debes aceptar los términos y condiciones para continuar.");
      return;
    }
    setIsSubmitting(true);

    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s !== '');

    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      email: user.email || '',
      photoURL: user.photoURL || '',
      role,
      bio,
      location,
      skills: role === 'electrician' ? skillsArray : [],
      createdAt: new Date().toISOString(),
      rating: 0,
      reviewCount: 0,
      acceptedTerms: true,
      acceptedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile(newProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl relative"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tighter">COMPLETAR PERFIL</h2>
            <p className="text-white/50">Cuéntanos quién eres para empezar.</p>
          </div>
          <button 
            type="button"
            onClick={onHelp}
            className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors"
            title="Ayuda"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-end">
            <button 
              type="button"
              onClick={() => {
                setRole('electrician');
                setLocation('Ciudad de México, CDMX');
                setBio('Electricista certificado con 10 años de experiencia en instalaciones industriales y residenciales.');
                setSkills('Paneles solares, Cableado industrial, Domótica');
                setAcceptedTerms(true);
              }}
              className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
            >
              Llenar con datos de prueba
            </button>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Soy un...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('electrician')}
                className={cn(
                  "py-4 rounded-2xl border font-bold transition-all",
                  role === 'electrician' ? "bg-blue-600 text-white border-blue-600" : "bg-white/5 text-white border-white/10"
                )}
              >
                Electricista
              </button>
              <button
                type="button"
                onClick={() => setRole('client')}
                className={cn(
                  "py-4 rounded-2xl border font-bold transition-all",
                  role === 'client' ? "bg-blue-600 text-white border-blue-600" : "bg-white/5 text-white border-white/10"
                )}
              >
                Cliente
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Ubicación</label>
            <input 
              type="text" 
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="ej. Ciudad de México, CDMX"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-600 transition-colors"
            />
          </div>

          {role === 'electrician' && (
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Habilidades (separadas por comas)</label>
              <input 
                type="text" 
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="ej. Paneles solares, Cableado industrial, Domótica"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-600 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Breve biografía</label>
            <textarea 
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={role === 'electrician' ? "Describe tu experiencia y conocimientos..." : "Describe tus necesidades típicas de proyectos..."}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-600 transition-colors h-32 resize-none"
            />
          </div>

          <div className="flex items-start gap-3">
            <input 
              type="checkbox" 
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor="terms" className="text-sm text-white/50 leading-tight">
              Acepto los <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 hover:underline">términos y condiciones</button> y la política de privacidad de ElectriApp.
            </label>
          </div>

          <button 
            disabled={isSubmitting || !acceptedTerms}
            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Empezar"}
          </button>
        </form>

        <AnimatePresence>
          {showTerms && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-zinc-900 border border-white/10 p-8 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-white tracking-tighter">TÉRMINOS Y CONDICIONES</h3>
                  <button onClick={() => setShowTerms(false)} className="text-white/50 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="prose prose-invert text-white/60 space-y-4 text-sm">
                  <p>Bienvenido a ElectriApp. Al utilizar nuestra plataforma, aceptas cumplir con los siguientes términos:</p>
                  
                  <h4 className="text-white font-bold">1. Naturaleza del Servicio</h4>
                  <p>ElectriApp es una plataforma de conexión entre clientes y profesionales electricistas. No somos responsables de la ejecución directa de los trabajos ni de las transacciones financieras externas.</p>
                  
                  <h4 className="text-white font-bold">2. Responsabilidad del Profesional</h4>
                  <p>Los electricistas registrados declaran contar con las certificaciones y conocimientos necesarios para realizar los trabajos ofrecidos de manera segura y profesional.</p>
                  
                  <h4 className="text-white font-bold">3. Seguridad y Conducta</h4>
                  <p>Ambas partes se comprometen a mantener una comunicación respetuosa y profesional a través de los canales proporcionados por la plataforma.</p>
                  
                  <h4 className="text-white font-bold">4. Privacidad de Datos</h4>
                  <p>Tus datos personales serán utilizados únicamente para facilitar la conexión entre usuarios y mejorar la experiencia en la plataforma, de acuerdo con nuestra política de privacidad.</p>
                  
                  <h4 className="text-white font-bold">5. Limitación de Responsabilidad</h4>
                  <p>ElectriApp no se hace responsable por daños, perjuicios o accidentes derivados de la prestación de servicios contratados a través de la plataforma.</p>
                </div>

                <button 
                  onClick={() => {
                    setAcceptedTerms(true);
                    setShowTerms(false);
                  }}
                  className="w-full mt-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all"
                >
                  Entendido y Aceptar
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

interface ProjectCardProps {
  project: Project;
  onAccept?: (id: string) => void;
  onComplete?: (id: string) => void;
  onReview?: (project: Project) => void;
  onChat?: (project: Project) => void;
  isClient?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onAccept, onComplete, onReview, onChat, isClient }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-blue-600/50 transition-all group"
    >
      <div className="flex justify-between items-start mb-4">
        <span className={cn(
          "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full",
          project.category === 'commercial' ? "bg-blue-500/20 text-blue-400" :
          project.category === 'industrial' ? "bg-purple-500/20 text-purple-400" :
          project.category === 'emergency' ? "bg-red-500/20 text-red-400" :
          "bg-green-500/20 text-green-400"
        )}>
          {project.category === 'residential' ? 'Residencial' : 
           project.category === 'commercial' ? 'Comercial' : 
           project.category === 'industrial' ? 'Industrial' : 'Emergencia'}
        </span>
        <div className="flex flex-col items-end">
          <span className="text-xl font-black text-blue-600">${project.budget.toLocaleString()}</span>
          <span className={cn(
            "text-[10px] font-bold uppercase mt-1",
            project.status === 'open' ? "text-green-400" :
            project.status === 'in-progress' ? "text-blue-400" :
            project.status === 'completed' ? "text-white/40" : "text-red-400"
          )}>
            {project.status === 'open' ? 'Abierto' :
             project.status === 'in-progress' ? 'En progreso' :
             project.status === 'completed' ? 'Completado' : 'Cancelado'}
          </span>
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-600 transition-colors">{project.title}</h3>
      <p className="text-white/50 text-sm mb-6 line-clamp-2">{project.description}</p>
      
      <div className="flex items-center gap-4 text-xs text-white/40 mb-6">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {project.location}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {format(new Date(project.createdAt), 'MMM d')}
        </div>
      </div>

      <div className="space-y-2">
        {onAccept && project.status === 'open' && (
          <button 
            onClick={() => onAccept(project.id)}
            className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-blue-600 transition-all"
          >
            Aceptar proyecto
          </button>
        )}

        {project.status === 'in-progress' && onChat && (
          <button 
            onClick={() => onChat(project)}
            className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" /> Chat del proyecto
          </button>
        )}

        {(isClient || !isClient) && project.status === 'in-progress' && onComplete && (
          <button 
            onClick={() => onComplete(project.id)}
            className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> Marcar como completado
          </button>
        )}

        {isClient && project.status === 'completed' && onReview && (
          <button 
            onClick={() => onReview(project)}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <Star className="w-4 h-4" /> Dejar reseña
          </button>
        )}
      </div>
    </motion.div>
  );
};

const ChatWindow = ({ project, currentUser, onClose }: { project: Project, currentUser: UserProfile, onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('projectId', '==', project.id),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'messages'));
    return unsub;
  }, [project.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const receiverId = currentUser.role === 'client' ? project.electricianId : project.clientId;
      if (!receiverId) throw new Error("No receiver found");

      await addDoc(collection(db, 'messages'), {
        projectId: project.id,
        senderId: currentUser.uid,
        receiverId,
        text: newMessage.trim(),
        createdAt: new Date().toISOString()
      });
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-zinc-900 rounded-[2rem] border border-white/10 shadow-2xl flex flex-col h-[600px] max-h-[80vh]"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-[2rem]">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight uppercase">{project.title}</h3>
            <p className="text-xs text-white/40 font-bold tracking-widest uppercase">Chat de Proyecto</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {messages.length > 0 ? (
            messages.map((m) => (
              <div 
                key={m.id} 
                className={cn(
                  "flex flex-col max-w-[80%]",
                  m.senderId === currentUser.uid ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm font-medium",
                  m.senderId === currentUser.uid 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white/10 text-white rounded-tl-none"
                )}>
                  {m.text}
                </div>
                <span className="text-[10px] text-white/20 mt-1 font-bold">
                  {format(new Date(m.createdAt), 'HH:mm')}
                </span>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <MessageSquare className="w-12 h-12 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">No hay mensajes aún</p>
              <p className="text-xs mt-1">Inicia la conversación sobre el proyecto.</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-6 border-t border-white/10 bg-white/5 rounded-b-[2rem]">
          <div className="flex gap-3">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-600 outline-none transition-colors"
            />
            <button 
              disabled={!newMessage.trim() || isSending}
              className="p-3 bg-blue-600 text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ElectricianProfile = ({ electrician, onClose }: { electrician: UserProfile, onClose: () => void }) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('electricianId', '==', electrician.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'reviews'));
    return unsub;
  }, [electrician.uid]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-zinc-900 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-white/10 flex justify-between items-start">
          <div className="flex gap-6">
            <img src={electrician.photoURL} alt="" className="w-24 h-24 rounded-3xl border-2 border-blue-600 object-cover" />
            <div>
              <h3 className="text-3xl font-black text-white tracking-tighter mb-1">{electrician.displayName}</h3>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-blue-600">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("w-4 h-4", s <= (electrician.rating || 0) ? "fill-blue-600" : "text-white/20")} />
                  ))}
                </div>
                <span className="text-sm font-bold text-white/60">({electrician.reviewCount || 0} reseñas)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <MapPin className="w-4 h-4" /> {electrician.location}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <section>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-4">Biografía</h4>
            <p className="text-white/70 leading-relaxed">{electrician.bio}</p>
          </section>

          {electrician.skills && electrician.skills.length > 0 && (
            <section>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-4">Habilidades</h4>
              <div className="flex flex-wrap gap-2">
                {electrician.skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-6">Reseñas de clientes</h4>
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="p-6 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex text-blue-600">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("w-3 h-3", s <= review.rating ? "fill-blue-600" : "text-white/20")} />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                        {format(new Date(review.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm italic">"{review.comment}"</p>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center border border-white/5 border-dashed rounded-2xl">
                  <Star className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-white/30 text-sm">Este electricista aún no tiene reseñas.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

const ElectricianDashboard = ({ onChat, onComplete }: { onChat: (p: Project) => void, onComplete: (projectId: string) => void }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'mine'>('available');

  useEffect(() => {
    if (!user) return;

    // Available projects
    const qAvailable = query(
      collection(db, 'projects'), 
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );
    const unsubAvailable = onSnapshot(qAvailable, (snap) => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects'));

    // My projects
    const qMine = query(
      collection(db, 'projects'), 
      where('electricianId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubMine = onSnapshot(qMine, (snap) => {
      setMyProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects'));

    return () => {
      unsubAvailable();
      unsubMine();
    };
  }, [user]);

  const handleAcceptProject = async (projectId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'projects', projectId), {
        electricianId: user.uid,
        status: 'in-progress'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">PANEL DE CONTROL</h2>
          <p className="text-white/50">Encuentra tu próximo gran proyecto.</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          <button 
            onClick={() => setActiveTab('available')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'available' ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
            )}
          >
            Oportunidades disponibles
          </button>
          <button 
            onClick={() => setActiveTab('mine')}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === 'mine' ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
            )}
          >
            Mis proyectos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'available' ? (
          projects.length > 0 ? (
            projects.map(p => <ProjectCard key={p.id} project={p} onAccept={handleAcceptProject} />)
          ) : (
            <div className="col-span-full py-20 text-center bg-white/5 rounded-[3rem] border border-white/10 border-dashed flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-10 h-10 text-blue-600/40" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">NO HAY PROYECTOS DISPONIBLES</h3>
              <p className="text-white/40 font-medium max-w-sm mx-auto mb-8">
                Aún no hay oportunidades en tu área. Mantente atento o completa tu perfil para destacar.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Actualizar lista
              </button>
            </div>
          )
        ) : (
          myProjects.length > 0 ? (
            myProjects.map(p => <ProjectCard key={p.id} project={p} onChat={onChat} onComplete={onComplete} />)
          ) : (
            <div className="col-span-full py-20 text-center bg-white/5 rounded-[3rem] border border-white/10 border-dashed flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
                <Briefcase className="w-10 h-10 text-blue-600/40" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">SIN PROYECTOS ACTIVOS</h3>
              <p className="text-white/40 font-medium max-w-sm mx-auto mb-8">
                Todavía no has aceptado ninguna oportunidad. ¡Explora la pestaña de oportunidades para empezar!
              </p>
              <button 
                onClick={() => setActiveTab('available')}
                className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl hover:scale-105 transition-transform"
              >
                Explorar oportunidades
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

const COMMON_SKILLS = [
  'Instalaciones residenciales',
  'Mantenimiento industrial',
  'Iluminación LED',
  'Paneles solares',
  'Sistemas de seguridad',
  'Cableado estructurado',
  'Reparaciones de emergencia',
  'Automatización del hogar',
  'Certificaciones eléctricas',
];

const ClientDashboard = ({ onChat, onViewElectrician, onComplete }: { onChat: (p: Project) => void, onViewElectrician: (e: UserProfile) => void, onComplete: (projectId: string) => void }) => {
  const { user } = useAuth();
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [electricians, setElectricians] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'search'>('projects');
  const [isPosting, setIsPosting] = useState(false);
  
  // Search state
  const [searchLocation, setSearchLocation] = useState('');
  const [searchSkill, setSearchSkill] = useState('');

  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    budget: '',
    location: '',
    category: 'residential' as ProjectCategory
  });

  // Review state
  const [reviewingProject, setReviewingProject] = useState<Project | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // My projects
    const qProjects = query(
      collection(db, 'projects'), 
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubProjects = onSnapshot(qProjects, (snap) => {
      setMyProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'projects'));

    // Electricians
    const qElectricians = query(collection(db, 'users'), where('role', '==', 'electrician'));
    const unsubElectricians = onSnapshot(qElectricians, (snap) => {
      setElectricians(snap.docs.map(doc => doc.data() as UserProfile));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    return () => {
      unsubProjects();
      unsubElectricians();
    };
  }, [user]);

  const filteredElectricians = electricians.filter(e => {
    const matchesLocation = e.location?.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesSkill = searchSkill === '' || e.skills?.some(skill => 
      skill.toLowerCase().includes(searchSkill.toLowerCase())
    );
    return matchesLocation && matchesSkill;
  });

  const handlePostProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'projects'), {
        ...newProject,
        budget: Number(newProject.budget),
        clientId: user.uid,
        status: 'open',
        createdAt: new Date().toISOString()
      });
      setIsPosting(false);
      setNewProject({ title: '', description: '', budget: '', location: '', category: 'residential' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'projects');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewingProject || !reviewingProject.electricianId) return;
    
    setIsSubmittingReview(true);
    try {
      const reviewData = {
        projectId: reviewingProject.id,
        clientId: user.uid,
        electricianId: reviewingProject.electricianId,
        rating,
        comment,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'reviews'), reviewData);

      // Update electrician's rating
      const electricianRef = doc(db, 'users', reviewingProject.electricianId);
      const electricianSnap = await getDoc(electricianRef);
      
      if (electricianSnap.exists()) {
        const data = electricianSnap.data() as UserProfile;
        const currentRating = data.rating || 0;
        const currentCount = data.reviewCount || 0;
        
        const newCount = currentCount + 1;
        const newRating = ((currentRating * currentCount) + rating) / newCount;
        
        await updateDoc(electricianRef, {
          rating: newRating,
          reviewCount: newCount
        });
      }

      setReviewingProject(null);
      setRating(5);
      setComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">
            {activeTab === 'projects' ? 'MIS PROYECTOS' : 'BUSCAR ELECTRICISTAS'}
          </h2>
          <p className="text-white/50">
            {activeTab === 'projects' 
              ? 'Gestiona tus oportunidades de proyectos eléctricos.' 
              : 'Encuentra al profesional perfecto para tu proyecto.'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            <button 
              onClick={() => setActiveTab('projects')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'projects' ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
              )}
            >
              Mis proyectos
            </button>
            <button 
              onClick={() => setActiveTab('search')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === 'search' ? "bg-blue-600 text-white" : "text-white/60 hover:text-white"
              )}
            >
              Buscar electricistas
            </button>
          </div>

          {activeTab === 'projects' && (
            <button 
              onClick={() => setIsPosting(true)}
              className="px-6 py-3 bg-blue-600 text-white font-black rounded-2xl hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Publicar nuevo proyecto
            </button>
          )}
        </div>
      </div>

      {activeTab === 'projects' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myProjects.length > 0 ? (
            myProjects.map(p => (
              <ProjectCard 
                key={p.id} 
                project={p} 
                isClient={true}
                onComplete={onComplete}
                onReview={(proj) => setReviewingProject(proj)}
                onChat={onChat}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white/5 rounded-[3rem] border border-white/10 border-dashed flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
                <Plus className="w-10 h-10 text-blue-600/40" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">SIN PROYECTOS PUBLICADOS</h3>
              <p className="text-white/40 font-medium max-w-sm mx-auto mb-8">
                Publica tu primer proyecto para encontrar a los mejores electricistas de la región.
              </p>
              <button 
                onClick={() => setIsPosting(true)}
                className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Publicar mi primer proyecto
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input 
                type="text"
                placeholder="Filtrar por ubicación..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-blue-600 outline-none transition-colors"
              />
            </div>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <select
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-blue-600 outline-none transition-colors appearance-none"
              >
                <option value="" className="bg-zinc-900">Todas las habilidades</option>
                {COMMON_SKILLS.map(skill => (
                  <option key={skill} value={skill} className="bg-zinc-900">{skill}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredElectricians.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredElectricians.map((e) => (
                <motion.div 
                  key={e.uid}
                  whileHover={{ y: -5 }}
                  className="p-8 bg-white/5 rounded-[2rem] border border-white/10 hover:border-blue-600/50 transition-all cursor-pointer group"
                  onClick={() => onViewElectrician(e)}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <img src={e.photoURL} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-600 transition-colors">{e.displayName}</h3>
                      <div className="flex items-center gap-1 text-blue-600">
                        <Star className="w-3 h-3 fill-blue-600" />
                        <span className="text-sm font-bold">{e.rating?.toFixed(1) || 'N/A'}</span>
                        <span className="text-xs text-white/30 ml-1">({e.reviewCount || 0})</span>
                      </div>
                    </div>
                  </div>
                  
                  {e.skills && e.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {e.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-white/60 font-medium">
                          {skill}
                        </span>
                      ))}
                      {e.skills.length > 3 && (
                        <span className="text-[10px] text-white/30 font-medium">+{e.skills.length - 3} más</span>
                      )}
                    </div>
                  )}

                  <p className="text-white/50 text-sm line-clamp-2 mb-6">{e.bio}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/30 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {e.location}
                    </span>
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                      Ver perfil <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white/5 rounded-[2rem] border border-white/10 border-dashed">
              <Search className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-bold">No se encontraron electricistas con esos criterios.</p>
              <button 
                onClick={() => { setSearchLocation(''); setSearchSkill(''); }}
                className="mt-4 text-blue-600 text-sm font-bold hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {isPosting && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPosting(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 rounded-3xl border border-white/10 p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black text-white tracking-tighter">PUBLICAR PROYECTO</h3>
                <button onClick={() => setIsPosting(false)} className="text-white/40 hover:text-white">
                  <X />
                </button>
              </div>

              <form onSubmit={handlePostProject} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Título</label>
                    <input 
                      type="text" required
                      value={newProject.title}
                      onChange={e => setNewProject({...newProject, title: e.target.value})}
                      placeholder="ej. Actualización de panel comercial"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Categoría</label>
                    <select 
                      value={newProject.category}
                      onChange={e => setNewProject({...newProject, category: e.target.value as ProjectCategory})}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-600 outline-none"
                    >
                      <option value="residential">Residencial</option>
                      <option value="commercial">Comercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="emergency">Emergencia</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Presupuesto ($)</label>
                    <input 
                      type="number" required
                      value={newProject.budget}
                      onChange={e => setNewProject({...newProject, budget: e.target.value})}
                      placeholder="5000"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Ubicación</label>
                    <input 
                      type="text" required
                      value={newProject.location}
                      onChange={e => setNewProject({...newProject, location: e.target.value})}
                      placeholder="Ciudad, Estado"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Descripción</label>
                  <textarea 
                    required
                    value={newProject.description}
                    onChange={e => setNewProject({...newProject, description: e.target.value})}
                    placeholder="Describe el alcance del trabajo..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-600 outline-none h-32 resize-none"
                  />
                </div>

                <button className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all">
                  Publicar oportunidad de proyecto
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {reviewingProject && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewingProject(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 rounded-3xl border border-white/10 p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-black text-white tracking-tighter mb-2 uppercase">Dejar reseña</h3>
              <p className="text-white/50 text-sm mb-8">Cuéntanos cómo fue tu experiencia con el electricista.</p>

              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Calificación</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star className={cn("w-8 h-8", s <= rating ? "text-blue-600 fill-blue-600" : "text-white/20")} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Comentario</label>
                  <textarea 
                    required
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Escribe tu reseña aquí..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-600 outline-none h-32 resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setReviewingProject(null)}
                    className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    disabled={isSubmittingReview}
                    className="flex-2 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all disabled:opacity-50"
                  >
                    {isSubmittingReview ? "Enviando..." : "Publicar reseña"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

const Footer = () => (
  <footer className="bg-zinc-900 border-t border-white/10 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">ElectriApp</span>
          </div>
          <p className="text-white/40 max-w-sm">
            Conectando a los mejores electricistas con los proyectos más desafiantes. 
            Calidad, seguridad y profesionalismo en cada conexión.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Plataforma</h4>
          <ul className="space-y-4 text-sm text-white/40">
            <li><a href="#" className="hover:text-blue-600 transition-colors">Proyectos</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Electricistas</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Cómo funciona</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Soporte</h4>
          <ul className="space-y-4 text-sm text-white/40">
            <li><a href="#" className="hover:text-blue-600 transition-colors">Centro de ayuda</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Contacto</a></li>
            <li><a href="#" className="hover:text-blue-600 transition-colors">Privacidad</a></li>
          </ul>
        </div>
      </div>
      <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-white/20">© 2026 ElectriApp. Todos los derechos reservados.</p>
        <div className="flex gap-6">
          <a href="#" className="text-white/20 hover:text-white transition-colors"><Zap className="w-4 h-4" /></a>
          <a href="#" className="text-white/20 hover:text-white transition-colors"><Zap className="w-4 h-4" /></a>
        </div>
      </div>
    </div>
  </footer>
);

const AppContent = () => {
  const { user, profile, loading } = useAuth();
  const [viewingElectrician, setViewingElectrician] = useState<UserProfile | null>(null);
  const [chatProject, setChatProject] = useState<Project | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const handleCompleteProject = async (projectId: string) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (!projectSnap.exists()) return;
      
      const projectData = projectSnap.data() as Project;
      
      // Update status in Firestore
      await updateDoc(projectRef, {
        status: 'completed'
      });

      // Fetch emails for both parties
      const clientSnap = await getDoc(doc(db, 'users', projectData.clientId));
      const electricianSnap = projectData.electricianId ? await getDoc(doc(db, 'users', projectData.electricianId)) : null;

      if (clientSnap.exists() && electricianSnap?.exists()) {
        const clientEmail = clientSnap.data().email;
        const electricianEmail = electricianSnap.data().email;

        // Send completion email via server API
        await fetch('/api/send-completion-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEmail,
            electricianEmail,
            projectName: projectData.title,
            projectUrl: `${window.location.origin}`
          })
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar onHelp={() => setShowHelp(true)} />
        <Hero onLogin={handleLogin} />
        <AnimatePresence>
          {showHelp && <HelpCenter onClose={() => setShowHelp(false)} />}
        </AnimatePresence>
      </div>
    );
  }

  if (!profile) {
    return (
      <>
        <ProfileSetup onHelp={() => setShowHelp(true)} />
        <AnimatePresence>
          {showHelp && <HelpCenter onClose={() => setShowHelp(false)} />}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar onHelp={() => setShowHelp(true)} />
      
      {profile.role === 'electrician' ? (
        <ElectricianDashboard onChat={(p) => setChatProject(p)} onComplete={handleCompleteProject} />
      ) : (
        <ClientDashboard 
          onChat={(p) => setChatProject(p)} 
          onViewElectrician={(e) => setViewingElectrician(e)}
          onComplete={handleCompleteProject}
        />
      )}

      <Footer />

      <AnimatePresence>
        {showHelp && <HelpCenter onClose={() => setShowHelp(false)} />}
        {viewingElectrician && (
          <ElectricianProfile 
            electrician={viewingElectrician} 
            onClose={() => setViewingElectrician(null)} 
          />
        )}
        {chatProject && (
          <ChatWindow 
            project={chatProject}
            currentUser={profile}
            onClose={() => setChatProject(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <FirebaseProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </FirebaseProvider>
  );
}
