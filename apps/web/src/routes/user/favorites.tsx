import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useQuery } from "@tanstack/react-query";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { Heart } from "lucide-react";

function FavoritesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  // Obtener los detalles de los anime favoritos
  const { data: favoriteAnimes, isLoading: animesLoading } = useQuery({
    queryKey: ["favorites", profile?.favorites],
    queryFn: async () => {
      if (!profile?.favorites || profile.favorites.length === 0) {
        return [];
      }

      // Obtener los detalles de cada anime favorito
      const animePromises = profile.favorites.map(async (id) => {
        const response = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.data;
      });

      const results = await Promise.all(animePromises);
      return results.filter((anime) => anime !== null);
    },
    enabled: !!profile && profile.favorites.length > 0,
  });

  // Si no está autenticado
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Heart className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">{t("favorites.notLoggedIn")}</h2>
        <p className="text-muted-foreground">{t("favorites.loginToView")}</p>
      </div>
    );
  }

  // Mientras carga el perfil
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Si el perfil ya cargó pero no hay favoritos
  if (!profile?.favorites || profile.favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Heart className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">{t("favorites.empty")}</h2>
        <p className="text-muted-foreground">{t("favorites.emptyDescription")}</p>
      </div>
    );
  }

  // Mientras cargan los detalles de los anime
  if (animesLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="h-8 w-8 fill-red-500 text-red-500" />
            {t("user.favorites")}
          </h1>
          <p className="text-muted-foreground">
            {t("favorites.count", { count: profile.favorites.length })}
          </p>
        </div>

        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t("favorites.loadingAnimes")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 fill-red-500 text-red-500" />
          {t("user.favorites")}
        </h1>
        <p className="text-muted-foreground">
          {t("favorites.count", { count: profile.favorites.length })}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {favoriteAnimes?.map((anime) => (
          <AnimeCard key={anime.mal_id} anime={anime} />
        ))}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/user/favorites")({
  component: FavoritesPage,
});