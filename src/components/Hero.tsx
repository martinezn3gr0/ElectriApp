import { motion } from 'motion/react';
import { MoveRight, ShieldCheck, Activity, Trophy } from 'lucide-react';

export const Hero = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-black">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
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
              Buscar proyectos <MoveRight className="w-5 h-5" />
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
            { icon: ShieldCheck, title: 'Profesionales verificados', desc: 'Cada electricista es verificado y cuenta con licencia comprobada.' },
            { icon: Activity, title: 'Clientes de alto valor', desc: 'Enfócate en proyectos comerciales, industriales y residenciales de gran escala.' },
            { icon: Trophy, title: 'Red de élite', desc: 'Únete al 5% superior de contratistas eléctricos en tu región.' },
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
