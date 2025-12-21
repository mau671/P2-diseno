// apps/web/src/hooks/use-auth.tsx
import { useState, useEffect } from 'react';
import { 
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    return signOut(auth);
  };

  const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword
  };
}