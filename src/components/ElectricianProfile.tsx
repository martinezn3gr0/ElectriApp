import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Star, Navigation, Trophy } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from './FirebaseProvider';
import { Review, UserProfile } from '../types';
import { cn } from '../lib/utils';

export const ElectricianProfile = ({
  electrician,
  onClose,
}: {
  electrician: UserProfile;
  onClose: () => void;
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('electricianId', '==', electrician.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review)));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reviews')
    );
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
                    <Star key={s} className={cn('w-4 h-4', s <= (electrician.rating || 0) ? 'fill-blue-600' : 'text-white/20')} />
                  ))}
                </div>
                <span className="text-sm font-bold text-white/60">({electrician.reviewCount || 0} reseñas)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/40">
                <Navigation className="w-4 h-4" /> {electrician.location}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      electrician.availability === 'available'
                        ? 'bg-green-500'
                        : electrician.availability === 'busy'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    )}
                  />
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                    {electrician.availability === 'available'
                      ? 'Disponible'
                      : electrician.availability === 'busy'
                        ? 'Ocupado'
                        : 'Desconectado'}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <Trophy className="w-3 h-3 text-blue-600" />
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                    {electrician.yearsOfExperience || 0} Años de experiencia
                  </span>
                </div>
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

          {electrician.certifications && electrician.certifications.length > 0 && (
            <section>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-4">Certificaciones</h4>
              <div className="flex flex-wrap gap-2">
                {electrician.certifications.map((cert, idx) => (
                  <span key={idx} className="px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-lg text-sm text-blue-400">
                    {cert}
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
                          <Star key={s} className={cn('w-3 h-3', s <= review.rating ? 'fill-blue-600' : 'text-white/20')} />
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
