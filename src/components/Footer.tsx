import { Link } from 'react-router-dom';
import { PlugZap } from 'lucide-react';

export const Footer = ({ onHelp }: { onHelp?: () => void }) => (
  <footer className="bg-zinc-900 border-t border-white/10 py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <PlugZap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">ElectriApp</span>
          </div>
          <p className="text-white/40 max-w-sm">
            Conectando a los mejores electricistas con los proyectos más desafiantes. Calidad, seguridad y profesionalismo en cada conexión.
          </p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Plataforma</h4>
          <ul className="space-y-4 text-sm text-white/40">
            <li>
              <Link to="/projects" className="hover:text-blue-600 transition-colors">
                Proyectos
              </Link>
            </li>
            <li>
              <Link to="/electricians" className="hover:text-blue-600 transition-colors">
                Electricistas
              </Link>
            </li>
            <li>
              <Link to="/#how-it-works" className="hover:text-blue-600 transition-colors">
                Cómo funciona
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Soporte</h4>
          <ul className="space-y-4 text-sm text-white/40">
            <li>
              <button onClick={onHelp} className="hover:text-blue-600 transition-colors">
                Centro de ayuda
              </button>
            </li>
            <li>
              <a href="mailto:soporte@electriapp.app" className="hover:text-blue-600 transition-colors">
                Contacto
              </a>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-blue-600 transition-colors">
                Privacidad
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-white/20">© 2026 ElectriApp. Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
);
