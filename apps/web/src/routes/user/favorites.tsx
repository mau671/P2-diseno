import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useUserProfile } from "@/hooks/use-user-profile";
import { useQuery } from "@tanstack/react-query";
import { AnimeCard } from "@/components/anime/AnimeCard";
import { Heart } from "lucide-react";

//Función helper para esperar
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function FavoritesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  //Obtiene los detalles de los anime favoritos
  const { data: favoriteAnimes, isLoading: animesLoading } = useQuery({
    queryKey: ["favorites", profile?.favorites],
    queryFn: async () => {
      if (!profile?.favorites || profile.favorites.length === 0) {
        return [];
      }

      console.log('Fetching favorites:', profile.favorites);

      //Obtiene los detalles de cada anime favorito
      const animes = [];
      for (const id of profile.favorites) {
        try {
          const response = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
          
          if (response.ok) {
            const data = await response.json();
            animes.push(data.data);
            console.log(`Loaded anime ${id}:`, data.data.title);
          } else {
            console.error(`Failed to load anime ${id}:`, response.status);
          }
          await sleep(30);
        } catch (error) {
          console.error(`Error fetching anime ${id}:`, error);
        }
      }

      console.log(`Loaded ${animes.length} of ${profile.favorites.length} favorites`);
      return animes;
    },
    enabled: !!profile && profile.favorites.length > 0,
    staleTime: 1000 * 60 * 5, 
  });

  //Si no está autenticado
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Heart className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">{t("favorites.notLoggedIn")}</h2>
        <p className="text-muted-foreground">{t("favorites.loginToView")}</p>
      </div>
    );
  }

  //Mientras carga el perfil
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

  //Si el perfil ya cargó pero no hay favoritos
  if (!profile?.favorites || profile.favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Heart className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">{t("favorites.empty")}</h2>
        <p className="text-muted-foreground">{t("favorites.emptyDescription")}</p>
      </div>
    );
  }

  //Mientras cargan los detalles de los anime
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
            <p className="text-xs text-muted-foreground mt-2">
              {t("common.loading")}...
            </p>
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
          {favoriteAnimes && favoriteAnimes.length > 0 
            ? `${favoriteAnimes.length} ${t("user.favorites").toLowerCase()}`
            : t("favorites.count", { count: profile.favorites.length })
          }
        </p>
      </div>

      {favoriteAnimes && favoriteAnimes.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {favoriteAnimes.map((anime) => (
            <AnimeCard key={anime.mal_id} anime={anime} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("common.error")}</p>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/user/favorites")({
  component: FavoritesPage,
});