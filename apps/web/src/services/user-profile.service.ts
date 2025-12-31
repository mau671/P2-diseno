// services/user-profile.service.ts
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  favorites: number[]; // Array de IDs de anime
  watchlist: number[];
  completed: number[];
  watching: number[];
  planToWatch: number[];
  dropped: number[];
  createdAt: Date;
  updatedAt: Date;
}

export const userProfileService = {
  //Crea el perfil de usuario
  async createProfile(uid: string, email: string, displayName: string | null = null, photoURL: string | null = null) {
    const userRef = doc(db, 'users', uid);
    const profile: UserProfile = {
      uid,
      email,
      displayName,
      photoURL,
      favorites: [],
      watchlist: [],
      completed: [],
      watching: [],
      planToWatch: [],
      dropped: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await setDoc(userRef, profile);
    return profile;
  },

  //perfil de usuario
  async getProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  },

  //Agrega a favoritos
  async addToFavorites(uid: string, animeId: number) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      favorites: arrayUnion(animeId),
      updatedAt: new Date(),
    });
  },

  //Borrar de favoritos
  async removeFromFavorites(uid: string, animeId: number) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      favorites: arrayRemove(animeId),
      updatedAt: new Date(),
    });
  },

  //Agregar a lista (watchlist, completed, etc.)
  async addToList(uid: string, listName: keyof Pick<UserProfile, 'watchlist' | 'completed' | 'watching' | 'planToWatch' | 'dropped'>, animeId: number) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      [listName]: arrayUnion(animeId),
      updatedAt: new Date(),
    });
  },

  //Borra de lista
  async removeFromList(uid: string, listName: keyof Pick<UserProfile, 'watchlist' | 'completed' | 'watching' | 'planToWatch' | 'dropped'>, animeId: number) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      [listName]: arrayRemove(animeId),
      updatedAt: new Date(),
    });
  },

  //Actualiza el perfil
  async updateProfile(uid: string, updates: Partial<UserProfile>) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  //Verifica si un anime está en favoritos
  async isFavorite(uid: string, animeId: number): Promise<boolean> {
    const profile = await this.getProfile(uid);
    return profile?.favorites.includes(animeId) ?? false;
  },

  //Verifica si un anime está en una lista específica
  async isInList(uid: string, listName: keyof Pick<UserProfile, 'watchlist' | 'completed' | 'watching' | 'planToWatch' | 'dropped'>, animeId: number): Promise<boolean> {
    const profile = await this.getProfile(uid);
    return profile?.[listName].includes(animeId) ?? false;
  }
};