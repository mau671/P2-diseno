import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { userProfileService, type UserProfile } from '@/services/user-profile.service';
import { toast } from 'sonner';
import i18n from '@/i18n';

const FAVORITES_CACHE_KEY = 'anime-app-favorites-cache';
const LAST_USER_KEY = 'anime-app-last-user-uid';

// Helper functions for localStorage cache
function getCachedFavorites(uid: string): number[] | null {
  try {
    const cached = localStorage.getItem(`${FAVORITES_CACHE_KEY}-${uid}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function setCachedFavorites(uid: string, favorites: number[]): void {
  try {
    localStorage.setItem(`${FAVORITES_CACHE_KEY}-${uid}`, JSON.stringify(favorites));
    // Also save the last user uid for immediate access on reload
    localStorage.setItem(LAST_USER_KEY, uid);
  } catch {
    // Ignore storage errors
  }
}

function getLastUserUid(): string | null {
  try {
    return localStorage.getItem(LAST_USER_KEY);
  } catch {
    return null;
  }
}

function clearLastUserUid(): void {
  try {
    localStorage.removeItem(LAST_USER_KEY);
  } catch {
    // Ignore errors
  }
}


export function useUserProfile() {
  const { user, updateAuthProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedFromCacheRef = useRef(false);

  // Initialize favorites from cache immediately when user is available
  useEffect(() => {
    if (!user || initializedFromCacheRef.current) return;

    const cachedFavorites = getCachedFavorites(user.uid);
    if (cachedFavorites) {
      // Create a minimal profile with cached favorites for immediate display
      setProfile((prev) => {
        if (prev) return prev; // Already have a full profile
        return {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          favorites: cachedFavorites,
          watchlist: [],
          completed: [],
          watching: [],
          planToWatch: [],
          dropped: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });
      initializedFromCacheRef.current = true;
    }
  }, [user]);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      let userProfile = await userProfileService.getProfile(user.uid);
      
      //Si no existe el perfil se crea
      if (!userProfile) {
        userProfile = await userProfileService.createProfile(
          user.uid,
          user.email!,
          user.displayName,
          user.photoURL
        );
      }
      
      // Update cache with fresh favorites from Firebase
      setCachedFavorites(user.uid, userProfile.favorites);
      
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      initializedFromCacheRef.current = false;
      // Clear last user uid on logout
      clearLastUserUid();
      return;
    }

    setLoading(true);
    loadProfile();
  }, [user, loadProfile]);

  // Optimistic toggle - updates UI immediately, rolls back on error
  const toggleFavorite = async (animeId: number) => {
    if (!user || !profile) return;

    const isFav = profile.favorites.includes(animeId);
    const previousFavorites = [...profile.favorites];
    
    // Optimistic update - change state immediately
    const newFavorites = isFav
      ? profile.favorites.filter(id => id !== animeId)
      : [...profile.favorites, animeId];
    
    setProfile({
      ...profile,
      favorites: newFavorites
    });
    
    // Update cache immediately for faster reload experience
    setCachedFavorites(user.uid, newFavorites);

    try {
      // Make the API call
      if (isFav) {
        await userProfileService.removeFromFavorites(user.uid, animeId);
      } else {
        await userProfileService.addToFavorites(user.uid, animeId);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // Rollback to previous state on error
      setProfile({
        ...profile,
        favorites: previousFavorites
      });
      
      // Rollback cache as well
      setCachedFavorites(user.uid, previousFavorites);
      
      // Show error toast
      const errorMessage = i18n.t('favorites.error', { defaultValue: 'Error al actualizar favoritos' });
      toast.error(errorMessage);
    }
  };

  const addToList = async (listName: keyof Pick<UserProfile, 'watchlist' | 'completed' | 'watching' | 'planToWatch' | 'dropped'>, animeId: number) => {
    if (!user || !profile) return;

    try {
      await userProfileService.addToList(user.uid, listName, animeId);
      setProfile({
        ...profile,
        [listName]: [...profile[listName], animeId]
      });
    } catch (error) {
      console.error('Error adding to list:', error);
    }
  };

  const removeFromList = async (listName: keyof Pick<UserProfile, 'watchlist' | 'completed' | 'watching' | 'planToWatch' | 'dropped'>, animeId: number) => {
    if (!user || !profile) return;

    try {
      await userProfileService.removeFromList(user.uid, listName, animeId);
      setProfile({
        ...profile,
        [listName]: profile[listName].filter(id => id !== animeId)
      });
    } catch (error) {
      console.error('Error removing from list:', error);
    }
  };

  const isFavorite = (animeId: number) => {
    // First check profile if available
    if (profile?.favorites) {
      return profile.favorites.includes(animeId);
    }
    
    // Fallback: check cache directly if profile not loaded yet
    // Use current user uid, or last known user uid for immediate display
    const uidToCheck = user?.uid ?? getLastUserUid();
    if (uidToCheck) {
      const cached = getCachedFavorites(uidToCheck);
      if (cached) {
        return cached.includes(animeId);
      }
    }
    
    return false;
  };

  const isInList = (listName: keyof Pick<UserProfile, 'watchlist' | 'completed' | 'watching' | 'planToWatch' | 'dropped'>, animeId: number) => {
    return profile?.[listName].includes(animeId) ?? false;
  };

  const updateDisplayName = async (displayName: string) => {
    if (!user || !profile) return;

    try {
      // Update Firestore
      await userProfileService.updateDisplayName(user.uid, displayName);
      
      // Update Firebase Auth
      await updateAuthProfile({ displayName });
      
      // Update local state
      setProfile({
        ...profile,
        displayName,
      });
    } catch (error) {
      console.error('Error updating display name:', error);
      throw error;
    }
  };

  const updatePhotoURL = async (photoURL: string | null) => {
    if (!user || !profile) return;

    try {
      const urlToSave = photoURL || "";
      
      // Update Firestore
      await userProfileService.updatePhotoURL(user.uid, urlToSave);
      
      // Update Firebase Auth (convert null to undefined)
      await updateAuthProfile({ photoURL: photoURL || undefined });
      
      // Update local state
      setProfile({
        ...profile,
        photoURL: photoURL || null,
      });
    } catch (error) {
      console.error('Error updating photo URL:', error);
      throw error;
    }
  };

  return {
    profile,
    loading,
    toggleFavorite,
    addToList,
    removeFromList,
    isFavorite,
    isInList,
    refreshProfile: loadProfile,
    updateDisplayName,
    updatePhotoURL
  };
}