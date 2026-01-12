import { useState, useEffect } from 'react';
import { 
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithCredential,
  linkWithPopup,
  unlink
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

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
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

  const updateAuthProfile = async (updates: { displayName?: string; photoURL?: string | null }) => {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    await updateProfile(auth.currentUser, updates);
    setUser((prevUser) => {
      if (!prevUser) return null;
      return { ...prevUser, ...updates } as User;
    });
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No user is currently signed in');
    }

    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPassword);
  };

  const deleteAccount = async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No user is currently signed in');
    }

    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      password
    );
    await reauthenticateWithCredential(auth.currentUser, credential);
    await deleteUser(auth.currentUser);
    setUser(null);
  };

  const linkPassword = async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error("No user or email available");
    }

    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      password
    );

    await linkWithCredential(auth.currentUser, credential);
  };

  const linkGoogle = async () => {
    if (!auth.currentUser) {
      throw new Error("No user signed in");
    }

    const provider = new GoogleAuthProvider();
    await linkWithPopup(auth.currentUser, provider);
  };

  const unlinkGoogle = async () => {
    if (!auth.currentUser) {
      throw new Error("No user signed in");
    }

    // Verificar que el usuario tenga al menos otro método de autenticación
    const providers = auth.currentUser.providerData.map((p) => p.providerId);
    if (providers.length <= 1) {
      throw new Error("Cannot unlink the only authentication method");
    }

    await unlink(auth.currentUser, "google.com");
  };

  const providers = user?.providerData.map((p) => p.providerId) ?? [];
  const hasPassword = providers.includes("password");
  const hasGoogle = providers.includes("google.com");

  return {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    updateAuthProfile,
    changePassword,
    deleteAccount,
    hasGoogle,
    hasPassword,
    providers,
    linkPassword,
    linkGoogle,
    unlinkGoogle
  };
}