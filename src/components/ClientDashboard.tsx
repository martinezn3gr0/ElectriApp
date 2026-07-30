import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  PlusCircle,
  Navigation,
  ScanSearch,
  BadgeCheck,
  Activity,
  Trophy,
  Star,
  ChevronRight,
  X,
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, handleFirestoreError, OperationType } from './FirebaseProvider';
import { Project, ProjectCategory, UserProfile } from '../types';
import { ProjectCard } from './ProjectCard';
import { COMMON_SKILLS } from '../constants';
import { apiFetch } from '../lib/api';
import { cn } from '../lib/utils';

export const ClientDashboard = ({
  onChat,
  onViewElectrician,
  onComplete,
  initialTab = 'projects',
}: {
  onChat: (p: Project) => void;
  onViewElectrician: (e: UserProfile) => void;
  onComplete: (projectId: string) => void;
  initialTab?: 'projects' | 'search';
}) => {
  const { user } = useAuth();
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [electricians, setElectricians] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'search'>(initialTab);
  const [isPosting, setIsPosting] = useState(false);

  const [searchLocation, setSearchLocation] = useState('');
  const [searchSkill, setSearchSkill] = useState('');
  const [searchAvailability, setSearchAvailability] = useState<'all' | 'available' | 'busy' | 'offline'>('all');
  const [searchMinExperience, setSearchMinExperience] = useState<number>(0);
  const [searchCertification, setSearchCertification] = useState('');

  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    budget: '',
    location: '',
    category: 'residential' as ProjectCategory,
  });

  const [reviewingProject, setReviewingProject] = useState<Project | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!user) return;

    const qProjects = query(
      collection(db, 'projects'),
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubProjects = onSnapshot(
      qProjects,
      (snap) => {
        setMyProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'projects')
    );

    const qElectricians = query(collection(db, 'users'), where('role', '==', 'electrician'));
    const unsubElectricians = onSnapshot(
      qElectricians,
      (snap) => {
        setElectricians(snap.docs.map((d) => d.data() as UserProfile));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'users')
    );

    return () => {
      unsubProjects();
      unsubElectricians();
    };
  }, [user]);

  const filteredElectricians = electricians.filter((e) => {
    const matchesLocation = e.location?.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesSkill =
      searchSkill === '' ||
      e.skills?.some((skill) => skill.toLowerCase().includes(searchSkill.toLowerCase()));
    const matchesAvailability = searchAvailability === 'all' || e.availability === searchAvailability;
    const matchesExperience = (e.yearsOfExperience || 0) >= searchMinExperience;
    const matchesCertification =
      searchCertification === '' ||
      e.certifications?.some((cert) => cert.toLowerCase().includes(searchCertification.toLowerCase())) ||
      e.bio?.toLowerCase().includes(searchCertification.toLowerCase());

    return matchesLocation && matchesSkill && matchesAvailability && matchesExperience && matchesCertification;
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
        createdAt: new Date().toISOString(),
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
    setReviewError(null);
    try {
      await apiFetch('/api/submit-review', {
        method: 'POST',
        body: {
          projectId: reviewingProject.id,
          electricianId: reviewingProject.electricianId,
          rating,
          comment,
        },
      });

      setReviewingProject(null);
      setRating(5);
      setComment('');
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'No se pudo publicar la reseña');
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
                'px-6 py-2 rounded-xl text-sm font-bold transition-all',
                activeTab === 'projects' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
              )}
            >
              Mis proyectos
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={cn(
                'px-6 py-2 rounded-xl text-sm font-bold transition-all',
                activeTab === 'search' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
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
              <PlusCircle className="w-5 h-5" /> Publicar nuevo proyecto
            </button>
          )}
        </div>
      </div>

      {activeTab === 'projects' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myProjects.length > 0 ? (
            myProjects.map((p) => (
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
                <PlusCircle className="w-10 h-10 text-blue-600/40" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">SIN PROYECTOS PUBLICADOS</h3>
              <p className="text-white/40 font-medium max-w-sm mx-auto mb-8">
                Publica tu primer proyecto para encontrar a los mejores electricistas de la región.
              </p>
              <button
                onClick={() => setIsPosting(true)}
                className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:scale-105 transition-transform flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" /> Publicar mi primer proyecto
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Ubicación..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-blue-600 outline-none transition-colors"
              />
            </div>
            <div className="relative">
              <ScanSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <select
                value={searchSkill}
                onChange={(e) => setSearchSkill(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-blue-600 outline-none transition-colors appearance-none"
              >
                <option value="" className="bg-zinc-900">
                  Habilidades...
                </option>
                {COMMON_SKILLS.map((skill) => (
                  <option key={skill} value={skill} className="bg-zinc-900">
                    {skill}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Certificación..."
                value={searchCertification}
                onChange={(e) => setSearchCertification(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-blue-600 outline-none transition-colors"
              />
            </div>
            <div className="relative">
              <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <select
                value={searchAvailability}
                onChange={(e) => setSearchAvailability(e.target.value as typeof searchAvailability)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-blue-600 outline-none transition-colors appearance-none"
              >
                <option value="all" className="bg-zinc-900">
                  Disponibilidad...
                </option>
                <option value="available" className="bg-zinc-900">
                  Disponible
                </option>
                <option value="busy" className="bg-zinc-900">
                  Ocupado
                </option>
                <option value="offline" className="bg-zinc-900">
                  Desconectado
                </option>
              </select>
            </div>
            <div className="relative">
              <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <select
                value={searchMinExperience}
                onChange={(e) => setSearchMinExperience(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:border-blue-600 outline-none transition-colors appearance-none"
              >
                <option value="0" className="bg-zinc-900">
                  Experiencia...
                </option>
                <option value="1" className="bg-zinc-900">
                  1+ años
                </option>
                <option value="3" className="bg-zinc-900">
                  3+ años
                </option>
                <option value="5" className="bg-zinc-900">
                  5+ años
                </option>
                <option value="10" className="bg-zinc-900">
                  10+ años
                </option>
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
                    <div className="relative">
                      <img src={e.photoURL} alt="" className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                      <div
                        className={cn(
                          'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900',
                          e.availability === 'available'
                            ? 'bg-green-500'
                            : e.availability === 'busy'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-blue-600 transition-colors">{e.displayName}</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-blue-600">
                          <Star className="w-3 h-3 fill-blue-600" />
                          <span className="text-sm font-bold">{e.rating?.toFixed(1) || 'N/A'}</span>
                        </div>
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                          {e.yearsOfExperience || 0} años exp.
                        </span>
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
                      <Navigation className="w-3 h-3" /> {e.location}
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
              <ScanSearch className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-bold">No se encontraron electricistas con esos criterios.</p>
              <button
                onClick={() => {
                  setSearchLocation('');
                  setSearchSkill('');
                  setSearchAvailability('all');
                  setSearchMinExperience(0);
                  setSearchCertification('');
                }}
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
                      type="text"
                      required
                      value={newProject.title}
                      onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                      placeholder="ej. Actualización de panel comercial"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Categoría</label>
                    <select
                      value={newProject.category}
                      onChange={(e) => setNewProject({ ...newProject, category: e.target.value as ProjectCategory })}
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
                      type="number"
                      required
                      value={newProject.budget}
                      onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                      placeholder="5000"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Ubicación</label>
                    <input
                      type="text"
                      required
                      value={newProject.location}
                      onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
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
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
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
                      <button key={s} type="button" onClick={() => setRating(s)} className="p-1 transition-transform hover:scale-110">
                        <Star className={cn('w-8 h-8', s <= rating ? 'text-blue-600 fill-blue-600' : 'text-white/20')} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Comentario</label>
                  <textarea
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escribe tu reseña aquí..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-600 outline-none h-32 resize-none"
                  />
                </div>

                {reviewError && <p className="text-sm text-red-400">{reviewError}</p>}

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
                    {isSubmittingReview ? 'Enviando...' : 'Publicar reseña'}
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
