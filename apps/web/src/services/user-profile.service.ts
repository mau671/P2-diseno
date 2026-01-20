import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const userProfileService = {
  async createProfile(uid: string, email: string, displayName: string | null = null, photoURL: string | null = null) {
    const userRef = doc(db, 'users', uid);
    const profile: UserProfile = {
      uid,
      email,
      displayName,
      photoURL,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await setDoc(userRef, profile);
    return profile;
  },

  async getProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  },

  async updateProfile(uid: string, updates: Partial<UserProfile>) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  async updateDisplayName(uid: string, displayName: string) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      displayName,
      updatedAt: new Date(),
    });
  },

  async updatePhotoURL(uid: string, photoURL: string) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      photoURL,
      updatedAt: new Date(),
    });
  }
};
