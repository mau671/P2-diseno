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
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'diseno-verano2025'
    });

    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: '661319432288.apps.googleusercontent.com',
      redirect_uri: redirectUri,
      response_type: 'id_token',
      scope: 'profile email',
      nonce: Math.random().toString(36).substring(7)
    }).toString()}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success') {
      const params = new URLSearchParams(result.url.split('#')[1]);
      const idToken = params.get('id_token');

      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      }
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

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'diseno-verano2025'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: '661319432288.apps.googleusercontent.com',
      redirect_uri: redirectUri,
      response_type: 'id_token',
      scope: 'profile email',
      nonce: Math.random().toString(36).substring(7)
    }).toString()}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type === 'success') {
      const params = new URLSearchParams(result.url.split('#')[1]);
      const idToken = params.get('id_token');

      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        await linkWithCredential(auth.currentUser, credential);
      }
    }
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
