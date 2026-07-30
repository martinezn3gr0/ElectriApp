import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Footer } from '../components/Footer';
import { HelpCenter } from '../components/HelpCenter';
import { LoginModal } from '../components/LoginModal';

export default function LandingPage() {
  const [showHelp, setShowHelp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-black">
      <Navbar onHelp={() => setShowHelp(true)} onLogin={() => setShowLogin(true)} />
      <Hero onLogin={() => setShowLogin(true)} />
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-white/5">
        <h2 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase">Cómo funciona</h2>
        <p className="text-white/50 max-w-2xl mb-10">
          Publica o encuentra proyectos eléctricos, chatea con la otra parte y cierra el trabajo con reseñas verificadas.
        </p>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            { step: '01', title: 'Crea tu perfil', desc: 'Regístrate como cliente o electricista y completa tu información.' },
            { step: '02', title: 'Conecta', desc: 'Publica un proyecto o acepta una oportunidad abierta en tu zona.' },
            { step: '03', title: 'Entrega y reseña', desc: 'Marca el trabajo como completado y deja una calificación segura.' },
          ].map((item) => (
            <li key={item.step} className="p-6 bg-white/5 rounded-3xl border border-white/10">
              <span className="text-blue-600 font-black text-sm tracking-widest">{item.step}</span>
              <h3 className="text-xl font-bold text-white mt-2 mb-2">{item.title}</h3>
              <p className="text-white/50 text-sm">{item.desc}</p>
            </li>
          ))}
        </ol>
      </section>
      <Footer onHelp={() => setShowHelp(true)} />
      <AnimatePresence>
        {showHelp && <HelpCenter onClose={() => setShowHelp(false)} />}
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </AnimatePresence>
    </div>
  );
}
