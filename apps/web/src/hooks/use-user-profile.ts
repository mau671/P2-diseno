import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { userProfileService, type UserProfile } from '@/services/user-profile.service';

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
      return;
    }

    setLoading(true);
    loadProfile();
  }, [user, loadProfile]);

  const toggleFavorite = async (animeId: number) => {
    if (!user || !profile) return;

    try {
      const isFav = profile.favorites.includes(animeId);
      
      if (isFav) {
        await userProfileService.removeFromFavorites(user.uid, animeId);
        setProfile({
          ...profile,
          favorites: profile.favorites.filter(id => id !== animeId)
        });
      } else {
        await userProfileService.addToFavorites(user.uid, animeId);
        setProfile({
          ...profile,
          favorites: [...profile.favorites, animeId]
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
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
    return profile?.favorites.includes(animeId) ?? false;
  };

  const isInList = (listName: keyof Pick<UserProfile, 'watchlist' | 'completed' | 'watching' | 'planToWatch' | 'dropped'>, animeId: number) => {
    return profile?.[listName].includes(animeId) ?? false;
  };

  return {
    profile,
    loading,
    toggleFavorite,
    addToList,
    removeFromList,
    isFavorite,
    isInList,
    refreshProfile: loadProfile
  };
}