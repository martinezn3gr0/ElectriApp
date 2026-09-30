import { motion } from 'motion/react';
import { X, UserCircle, Facebook } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../firebase';

export const LoginModal = ({ onClose }: { onClose: () => void }) => {
  const handleOAuthLogin = async (provider: typeof googleProvider) => {
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

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
        className="relative w-full max-w-md bg-zinc-900 rounded-[2.5rem] border border-white/10 p-10 shadow-2xl"
      >
        <div className="absolute top-0 right-0 p-8">
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-xl shadow-blue-600/20">
            <UserCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter mb-2 uppercase italic">Iniciar Sesión</h2>
          <p className="text-white/50">Elige tu plataforma preferida</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleOAuthLogin(googleProvider)}
            className="w-full py-4 bg-white text-black font-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
            CONTINUAR CON GOOGLE
          </button>

          <button
            onClick={() => handleOAuthLogin(facebookProvider)}
            className="w-full py-4 bg-[#1877F2] text-white font-black rounded-2xl hover:bg-[#166fe5] transition-all border border-white/10 flex items-center justify-center gap-3"
          >
            <Facebook className="w-5 h-5 fill-white" />
            CONTINUAR CON FACEBOOK
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-white/30 font-medium">
          Al iniciar sesión, aceptas nuestros <br />
          <span className="text-blue-600">Términos de Servicio</span> y <span className="text-blue-600">Privacidad</span>.
        </p>
      </motion.div>
    </div>
  );
};
