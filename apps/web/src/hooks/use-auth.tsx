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
  EmailAuthProvider
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

  const updateAuthProfile = async (updates: { displayName?: string; photoURL?: string | null }) => {
    if (!auth.currentUser) {
      throw new Error('No user is currently signed in');
    }
    await updateProfile(auth.currentUser, updates);
    // Update user state without causing a full re-render
    // The user object reference changes but React will handle it efficiently
    setUser((prevUser) => {
      if (!prevUser) return null;
      return { ...prevUser, ...updates } as User;
    });
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No user is currently signed in');
    }

    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    );
    await reauthenticateWithCredential(auth.currentUser, credential);

    // Update password
    await updatePassword(auth.currentUser, newPassword);
  };

  const deleteAccount = async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error('No user is currently signed in');
    }

    // Re-authenticate the user
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      password
    );
    await reauthenticateWithCredential(auth.currentUser, credential);

    // Delete the user account
    await deleteUser(auth.currentUser);
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateAuthProfile,
    changePassword,
    deleteAccount
  };
}