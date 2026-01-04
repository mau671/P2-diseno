import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { AnimeBase } from "@/api/queries";
import { useStablePastelColor } from "@/hooks/useStablePastelColor";
import { useCardTooltip } from "@/hooks/useCardTooltip";
import { useAnimeCardData } from "@/hooks/useAnimeCardData";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Heart } from "lucide-react";

type AnimeCardProps = {
  anime: AnimeBase;
};

function slugifyLocal(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function AnimeCard({ anime }: AnimeCardProps) {
  const navigate = useNavigate();
  const img = anime?.images?.webp?.large_image_url ||
              anime?.images?.jpg?.large_image_url ||
              anime?.images?.webp?.image_url ||
              anime?.images?.jpg?.image_url;
  const title = anime.title || anime.name || anime.titles?.[0]?.title;
  const { t } = useTranslation();
  const { pastelColor } = useStablePastelColor(anime.mal_id);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [isButtonVisible, setIsButtonVisible] = React.useState(false);
  const [isFavorited, setIsFavorited] = React.useState(false);

  const { placement, handleMouseEnter, handleMouseLeave } = useCardTooltip(cardRef);
  const { seasonInfo, scoreColor, typeInfo } = useAnimeCardData(anime);

  const handleCardMouseEnter = () => {
    handleMouseEnter();
    setIsButtonVisible(true);
  };

  const handleCardMouseLeave = () => {
    handleMouseLeave();
    setIsButtonVisible(false);
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
  };

  const handleCardClick = () => {
    const slug = slugifyLocal(title || "anime") || "anime";
    navigate({
      to: "/anime/$id/$slug",
      params: { id: String(anime.mal_id), slug },
    });
  };

  return (
    <div 
      className="flex-shrink-0 w-36 md:w-44 cursor-pointer group relative"
      ref={cardRef}
      onClick={handleCardClick}
      onMouseEnter={handleCardMouseEnter}
      onMouseLeave={handleCardMouseLeave}
    >
      <div className="relative overflow-hidden rounded-lg bg-muted aspect-[2/3]">
        {img ? (
          <img
            src={img}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={`absolute bottom-2 right-2 transition-all duration-200 ease-out z-10 bg-background/80 backdrop-blur-sm rounded-full p-2 hover:bg-background/90 hover:scale-110 shadow-lg cursor-pointer ${
                isButtonVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              onClick={handleHeartClick}
            >
              <Heart 
                className={`h-4 w-4 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-foreground'}`} 
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-popover text-popover-foreground border border-border">
            <p>{t("common.addToFavorites")}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div 
        className={`absolute top-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out z-50 pointer-events-none w-72 ${placement === 'right' ? 'left-full ml-4 -translate-x-2 group-hover:translate-x-0' : 'right-full mr-4 translate-x-2 group-hover:translate-x-0'}`}
      >
        <div className="bg-card border rounded-lg p-3 shadow-2xl shadow-black/20 pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            {seasonInfo && (
              <span className="text-sm font-medium">{seasonInfo}</span>
            )}
            {anime.score !== undefined && anime.score !== null && (
              <span 
                className="text-sm font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}
              >
                {anime.score}
              </span>
            )}
          </div>

          {anime.studios && anime.studios.length > 0 && (
            <div className="text-xs text-muted-foreground mb-1">
              {anime.studios.map((s) => s.name).join(", ")}
            </div>
          )}

          {typeInfo && (
            <div className="text-xs text-muted-foreground mb-2">
              {typeInfo}
            </div>
          )}

          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {anime.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre.mal_id}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ 
                    backgroundColor: `${pastelColor || '#a855f7'}30`, 
                    color: pastelColor || '#a855f7' 
                  }}
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <span 
        className="text-sm font-medium line-clamp-2 mt-2 transition-colors group-hover:[color:var(--hover-color)]"
        style={{ 
          '--hover-color': pastelColor || '#a855f7' 
        } as React.CSSProperties}
      >
        {title}
      </span>
    </div>
  );
}

export { AnimeCard };
