import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthReady: boolean;
  setProfile: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  // Log detailed diagnostics for developers; never surface auth PII to the UI.
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(`No se pudo completar la operación (${operationType}${path ? `: ${path}` : ''}).`);
}

export class ErrorBoundary extends React.Component<any, any> {
  state: any;
  props: any;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error?.message || 'Error desconocido' };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-8 text-center">
          <div className="max-w-md p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
            <h2 className="text-2xl font-black text-white mb-4 tracking-tighter">¡UPS! ALGO FALLÓ</h2>
            <p className="text-white/60 mb-6 text-sm leading-relaxed">
              Algo salió mal. Intenta de nuevo. Si el problema continúa, contacta soporte.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    }
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsAuthReady(true);
      
      if (user) {
        const profileRef = doc(db, 'users', user.uid);
        try {
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            setProfile(profileSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Error al obtener el perfil:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un FirebaseProvider');
  }
  return context;
};
