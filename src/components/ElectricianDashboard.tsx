import { useEffect, useState } from 'react';
import { PlugZap, HardHat, RotateCw } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, handleFirestoreError, OperationType } from './FirebaseProvider';
import { Project } from '../types';
import { ProjectCard } from './ProjectCard';
import { cn } from '../lib/utils';

export const ElectricianDashboard = ({
  onChat,
  onComplete,
}: {
  onChat: (p: Project) => void;
  onComplete: (projectId: string) => void;
}) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'mine'>('available');

  useEffect(() => {
    if (!user) return;

    const qAvailable = query(
      collection(db, 'projects'),
      where('status', '==', 'open'),
      orderBy('createdAt', 'desc')
    );
    const unsubAvailable = onSnapshot(
      qAvailable,
      (snap) => {
        setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'projects')
    );

    const qMine = query(
      collection(db, 'projects'),
      where('electricianId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubMine = onSnapshot(
      qMine,
      (snap) => {
        setMyProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'projects')
    );

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
        status: 'in-progress',
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
              'px-6 py-2 rounded-xl text-sm font-bold transition-all',
              activeTab === 'available' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
            )}
          >
            Oportunidades disponibles
          </button>
          <button
            onClick={() => setActiveTab('mine')}
            className={cn(
              'px-6 py-2 rounded-xl text-sm font-bold transition-all',
              activeTab === 'mine' ? 'bg-blue-600 text-white' : 'text-white/60 hover:text-white'
            )}
          >
            Mis proyectos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'available' ? (
          projects.length > 0 ? (
            projects.map((p) => <ProjectCard key={p.id} project={p} onAccept={handleAcceptProject} />)
          ) : (
            <div className="col-span-full py-20 text-center bg-white/5 rounded-[3rem] border border-white/10 border-dashed flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
                <PlugZap className="w-10 h-10 text-blue-600/40" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase">NO HAY PROYECTOS DISPONIBLES</h3>
              <p className="text-white/40 font-medium max-w-sm mx-auto mb-8">
                Aún no hay oportunidades en tu área. Mantente atento o completa tu perfil para destacar.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" /> Actualizar lista
              </button>
            </div>
          )
        ) : myProjects.length > 0 ? (
          myProjects.map((p) => <ProjectCard key={p.id} project={p} onChat={onChat} onComplete={onComplete} />)
        ) : (
          <div className="col-span-full py-20 text-center bg-white/5 rounded-[3rem] border border-white/10 border-dashed flex flex-col items-center">
            <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
              <HardHat className="w-10 h-10 text-blue-600/40" />
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
        )}
      </div>
    </div>
  );
};
