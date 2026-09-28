import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleHelp, X } from 'lucide-react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth, handleFirestoreError, OperationType } from './FirebaseProvider';
import { UserProfile, UserRole } from '../types';
import { toPublicProfile } from '../lib/publicProfile';
import { cn } from '../lib/utils';

export const ProfileSetup = ({ onHelp }: { onHelp: () => void }) => {
  const { user, setProfile } = useAuth();
  const [role, setRole] = useState<UserRole>('electrician');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [certifications, setCertifications] = useState('');
  const [availability, setAvailability] = useState<'available' | 'busy' | 'offline'>('available');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!acceptedTerms) {
      alert('Debes aceptar los términos y condiciones para continuar.');
      return;
    }
    setIsSubmitting(true);

    const skillsArray = skills.split(',').map((s) => s.trim()).filter((s) => s !== '');
    const certificationsArray = certifications.split(',').map((s) => s.trim()).filter((s) => s !== '');

    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || 'Anonymous',
      email: user.email || '',
      photoURL: user.photoURL || '',
      role,
      bio,
      location,
      skills: role === 'electrician' ? skillsArray : [],
      certifications: role === 'electrician' ? certificationsArray : [],
      availability: role === 'electrician' ? availability : undefined,
      yearsOfExperience: role === 'electrician' ? Math.max(0, Math.trunc(yearsOfExperience)) : undefined,
      createdAt: new Date().toISOString(),
      rating: 0,
      reviewCount: 0,
      acceptedTerms: true,
      acceptedAt: new Date().toISOString(),
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', user.uid), newProfile);
      batch.set(doc(db, 'publicProfiles', user.uid), toPublicProfile(newProfile));
      await batch.commit();
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
            <CircleHelp className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {import.meta.env.DEV && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setRole('electrician');
                  setLocation('Ciudad de México, CDMX');
                  setBio('Electricista certificado con 10 años de experiencia en instalaciones industriales y residenciales.');
                  setSkills('Paneles solares, Cableado industrial, Domótica');
                  setCertifications('NOM-001-SEDE, Licencia municipal CDMX');
                  setAvailability('available');
                  setYearsOfExperience(10);
                  setAcceptedTerms(true);
                }}
                className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
              >
                Llenar con datos de prueba
              </button>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Soy un...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('electrician')}
                className={cn(
                  'py-4 rounded-2xl border font-bold transition-all',
                  role === 'electrician' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/5 text-white border-white/10'
                )}
              >
                Electricista
              </button>
              <button
                type="button"
                onClick={() => setRole('client')}
                className={cn(
                  'py-4 rounded-2xl border font-bold transition-all',
                  role === 'client' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white/5 text-white border-white/10'
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
            <>
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

              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Certificaciones (separadas por comas)</label>
                <input
                  type="text"
                  value={certifications}
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="ej. NOM-001-SEDE, Licencia municipal"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Años de experiencia</label>
                  <input
                    type="number"
                    min="0"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Disponibilidad</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as 'available' | 'busy' | 'offline')}
                    className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-600 transition-colors"
                  >
                    <option value="available">Disponible</option>
                    <option value="busy">Ocupado</option>
                    <option value="offline">Desconectado</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Breve biografía</label>
            <textarea
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={role === 'electrician' ? 'Describe tu experiencia y conocimientos...' : 'Describe tus necesidades típicas de proyectos...'}
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
              Acepto los{' '}
              <button type="button" onClick={() => setShowTerms(true)} className="text-blue-600 hover:underline">
                términos y condiciones
              </button>{' '}
              y la política de privacidad de ElectriApp.
            </label>
          </div>

          <button
            disabled={isSubmitting || !acceptedTerms}
            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Empezar'}
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
