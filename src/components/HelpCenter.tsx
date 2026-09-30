import { motion } from 'motion/react';
import { X, CircleHelp, PlugZap, HardHat, ShieldCheck, MessageSquareText } from 'lucide-react';
import { cn } from '../lib/utils';

export const HelpCenter = ({ onClose }: { onClose: () => void }) => {
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
            <CircleHelp className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase italic">Centro de Ayuda</h2>
          <p className="text-white/50 text-lg">¿Cómo podemos ayudarte hoy?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'Soy Electricista',
              desc: 'Aprende cómo encontrar proyectos, comunicarte con clientes y recibir pagos.',
              icon: PlugZap,
              color: 'bg-blue-600',
            },
            {
              title: 'Soy Cliente',
              desc: 'Descubre cómo publicar proyectos, filtrar electricistas y gestionar contratos.',
              icon: HardHat,
              color: 'bg-purple-600',
            },
            {
              title: 'Seguridad y Pagos',
              desc: 'Información sobre nuestras políticas de seguridad y métodos de pago protegidos.',
              icon: ShieldCheck,
              color: 'bg-green-600',
            },
            {
              title: 'Soporte Técnico',
              desc: 'Contacta con nuestro equipo si tienes problemas con la plataforma.',
              icon: MessageSquareText,
              color: 'bg-orange-600',
            },
          ].map((item, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02, y: -5 }}
              className="p-6 bg-white/5 rounded-3xl border border-white/10 text-left group hover:border-white/20 transition-all"
            >
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', item.color)}>
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
              {[1, 2, 3].map((i) => (
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
