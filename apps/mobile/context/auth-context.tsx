import React, { createContext, useEffect, useState } from 'react';
import { 
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  linkWithCredential,
  unlink
} from 'firebase/auth';
import { auth } from '@/app/config/firebase';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// Client IDs
const EXPO_CLIENT_ID = '661319432288-0voa3ej7ue91mudjeiu3uj61hus4cpe5.apps.googleusercontent.com';
const WEB_CLIENT_ID = '661319432288-f4e0tfd3cha0h8p10pc0utk18fe3o71q.apps.googleusercontent.com';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateAuthProfile: (updates: { displayName?: string; photoURL?: string | null }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
  linkPassword: (password: string) => Promise<void>;
  linkGoogle: () => Promise<void>;
  unlinkGoogle: () => Promise<void>;
  hasPassword: boolean;
  hasGoogle: boolean;
  providers: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: EXPO_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    }
  }, [response]);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
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

    try {
      await promptAsync();
      // El useEffect manejará la vinculación cuando reciba la respuesta
    } catch (error) {
      console.error('Link Google error:', error);
      throw error;
    }
  };

  const unlinkGoogle = async () => {
    if (!auth.currentUser) {
      throw new Error("No user signed in");
    }

    const providers = auth.currentUser.providerData.map((p) => p.providerId);
    if (providers.length <= 1) {
      throw new Error("Cannot unlink the only authentication method");
    }

    await unlink(auth.currentUser, "google.com");
  };

  const providers = user?.providerData.map((p) => p.providerId) ?? [];
  const hasPassword = providers.includes("password");
  const hasGoogle = providers.includes("google.com");

  return (
    <AuthContext.Provider value={{ 
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
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;