import * as React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type WatchTimeCalculatorProps = {
  episodes: number | null | undefined;
  duration: string | null | undefined;
  className?: string;
};

/**
 * Parses duration string from Jikan API (e.g., "24 min per ep", "1 hr 30 min per ep")
 * Returns duration in minutes per episode
 */
function parseDuration(duration: string | null | undefined): number | null {
  if (!duration) return null;

  // Try to match patterns like "24 min per ep", "1 hr 30 min per ep", etc.
  const hourMatch = duration.match(/(\d+)\s*hr/i);
  const minMatch = duration.match(/(\d+)\s*min/i);

  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;

  if (hours === 0 && minutes === 0) return null;

  return hours * 60 + minutes;
}

/**
 * Gets plural form based on count (Spanish/English)
 */
function getPlural(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/**
 * Formats minutes into a human-readable string with proper pluralization
 */
function formatTime(minutes: number, t: (key: string, options?: Record<string, unknown>) => string, isSpanish: boolean): string {
  const roundedMinutes = Math.round(minutes);
  
  if (roundedMinutes < 60) {
    const minText = isSpanish 
      ? getPlural(roundedMinutes, "minuto", "minutos")
      : getPlural(roundedMinutes, "minute", "minutes");
    return t("anime.detail.watchTime.minutes", { count: roundedMinutes, minText, defaultValue: `${roundedMinutes} ${minText}` });
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours < 24) {
    if (remainingMinutes === 0) {
      const hourText = isSpanish
        ? getPlural(hours, "hora", "horas")
        : getPlural(hours, "hour", "hours");
      return t("anime.detail.watchTime.hours", { count: hours, hourText, defaultValue: `${hours} ${hourText}` });
    }
    return t("anime.detail.watchTime.hoursMinutes", {
      hours,
      minutes: remainingMinutes,
      defaultValue: `${hours}h ${remainingMinutes}m`,
    });
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours === 0) {
    const dayText = isSpanish
      ? getPlural(days, "día", "días")
      : getPlural(days, "day", "days");
    return t("anime.detail.watchTime.days", { count: days, dayText, defaultValue: `${days} ${dayText}` });
  }

  return t("anime.detail.watchTime.daysHours", {
    days,
    hours: remainingHours,
    defaultValue: `${days}d ${remainingHours}h`,
  });
}

/**
 * Calculates watch time statistics for an anime
 */
export function WatchTimeCalculator({ episodes, duration, className }: WatchTimeCalculatorProps) {
  const { t, i18n } = useTranslation();
  const isSpanish = (i18n.language || "").toLowerCase().startsWith("es");

  const minutesPerEpisode = React.useMemo(() => parseDuration(duration), [duration]);
  const totalMinutes = React.useMemo(() => {
    if (!episodes || !minutesPerEpisode) return null;
    return episodes * minutesPerEpisode;
  }, [episodes, minutesPerEpisode]);

  // Customizable viewing preferences
  const [episodesPerDay, setEpisodesPerDay] = React.useState<number>(2);
  const [hoursPerDay, setHoursPerDay] = React.useState<number>(2);
  
  // Temporary string values to allow clearing inputs
  const [episodesInputValue, setEpisodesInputValue] = React.useState<string>("2");
  const [hoursInputValue, setHoursInputValue] = React.useState<string>("2");

  // Sync input values when numeric values change externally
  React.useEffect(() => {
    setEpisodesInputValue(String(episodesPerDay));
  }, [episodesPerDay]);

  React.useEffect(() => {
    setHoursInputValue(String(hoursPerDay));
  }, [hoursPerDay]);

  // Don't render if we don't have enough data
  if (!episodes || !minutesPerEpisode || !totalMinutes) {
    return null;
  }

  const totalTimeFormatted = formatTime(totalMinutes, t, isSpanish);
  const hours = totalMinutes / 60;

  // Calculate viewing estimates based on custom preferences
  const daysAtCustomEpisodes = episodesPerDay > 0 ? Math.ceil(episodes / episodesPerDay) : null;
  const daysAtCustomHours = hoursPerDay > 0 ? Math.ceil(hours / hoursPerDay) : null;

  // Default estimates (only show if reasonable)
  const sessions1Hour = Math.ceil(hours);
  const sessions2Hours = Math.ceil(hours / 2);

  return (
    <div className={cn("rounded-2xl border p-5 bg-card overflow-hidden", className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-1">
          {t("anime.detail.watchTime.title", { defaultValue: "Tiempo de visualización" })}
        </h3>
        <p className="text-2xl font-bold text-foreground">{totalTimeFormatted}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t("anime.detail.watchTime.total", {
            episodes,
            minutesPerEpisode,
            defaultValue: `${episodes} episodios × ${minutesPerEpisode} min/ep`,
          })}
        </p>
      </div>

      {/* Customizable preferences */}
      <div className="pt-4 border-t space-y-4">
        <div>
          <p className="text-sm font-medium mb-3 text-foreground">
            {t("anime.detail.watchTime.customize", { defaultValue: "Personalizar estimación:" })}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="episodes-per-day" className="text-xs">
                {t("anime.detail.watchTime.episodesPerDay", { defaultValue: "Episodios/día" })}
              </Label>
              <Input
                id="episodes-per-day"
                type="number"
                min="1"
                max={episodes}
                value={episodesInputValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setEpisodesInputValue(value);
                  
                  if (value === "") {
                    // Allow empty input
                    return;
                  }
                  
                  const val = parseInt(value, 10);
                  if (!isNaN(val) && val > 0) {
                    setEpisodesPerDay(Math.min(val, episodes));
                  }
                }}
                onBlur={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val) || val < 1) {
                    setEpisodesPerDay(1);
                    setEpisodesInputValue("1");
                  } else if (val > episodes) {
                    setEpisodesPerDay(episodes);
                    setEpisodesInputValue(String(episodes));
                  } else {
                    setEpisodesInputValue(String(val));
                  }
                }}
                className="h-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours-per-day" className="text-xs">
                {t("anime.detail.watchTime.hoursPerDay", { defaultValue: "Horas/día" })}
              </Label>
              <Input
                id="hours-per-day"
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={hoursInputValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setHoursInputValue(value);
                  
                  if (value === "") {
                    // Allow empty input
                    return;
                  }
                  
                  const val = parseFloat(value);
                  if (!isNaN(val) && val > 0) {
                    setHoursPerDay(Math.min(val, 24));
                  }
                }}
                onBlur={(e) => {
                  const val = parseFloat(e.target.value);
                  if (isNaN(val) || val < 0.5) {
                    setHoursPerDay(0.5);
                    setHoursInputValue("0.5");
                  } else if (val > 24) {
                    setHoursPerDay(24);
                    setHoursInputValue("24");
                  } else {
                    setHoursInputValue(String(val));
                  }
                }}
                className="h-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
          </div>
        </div>

        {/* Custom estimates */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {t("anime.detail.watchTime.estimates", { defaultValue: "Estimaciones:" })}
          </p>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            {daysAtCustomEpisodes !== null && daysAtCustomEpisodes <= 365 && (
              <li>
                • {t("anime.detail.watchTime.daysAtEpisodes", {
                  count: daysAtCustomEpisodes,
                  episodesPerDay,
                  dayText: isSpanish 
                    ? getPlural(daysAtCustomEpisodes, "día", "días")
                    : getPlural(daysAtCustomEpisodes, "day", "days"),
                  episodeText: isSpanish
                    ? getPlural(episodesPerDay, "episodio", "episodios")
                    : getPlural(episodesPerDay, "episode", "episodes"),
                  defaultValue: `${daysAtCustomEpisodes} ${isSpanish ? (daysAtCustomEpisodes === 1 ? "día" : "días") : (daysAtCustomEpisodes === 1 ? "day" : "days")} viendo ${episodesPerDay} ${isSpanish ? (episodesPerDay === 1 ? "episodio" : "episodios") : (episodesPerDay === 1 ? "episode" : "episodes")}/día`,
                })}
              </li>
            )}
            {daysAtCustomHours !== null && daysAtCustomHours <= 365 && (
              <li>
                • {t("anime.detail.watchTime.daysAtHours", {
                  count: daysAtCustomHours,
                  hoursPerDay,
                  dayText: isSpanish
                    ? getPlural(daysAtCustomHours, "día", "días")
                    : getPlural(daysAtCustomHours, "day", "days"),
                  hourText: isSpanish
                    ? getPlural(Math.floor(hoursPerDay), "hora", "horas")
                    : getPlural(Math.floor(hoursPerDay), "hour", "hours"),
                  defaultValue: `${daysAtCustomHours} ${isSpanish ? (daysAtCustomHours === 1 ? "día" : "días") : (daysAtCustomHours === 1 ? "day" : "days")} viendo ${hoursPerDay} ${isSpanish ? (Math.floor(hoursPerDay) === 1 ? "hora" : "horas") : (Math.floor(hoursPerDay) === 1 ? "hour" : "hours")}/día`,
                })}
              </li>
            )}
            {sessions1Hour <= 50 && (
              <li>
                • {t("anime.detail.watchTime.sessions1Hour", {
                  count: sessions1Hour,
                  sessionText: isSpanish
                    ? getPlural(sessions1Hour, "sesión", "sesiones")
                    : getPlural(sessions1Hour, "session", "sessions"),
                  defaultValue: `${sessions1Hour} ${isSpanish ? (sessions1Hour === 1 ? "sesión" : "sesiones") : (sessions1Hour === 1 ? "session" : "sessions")} de 1 hora`,
                })}
              </li>
            )}
            {sessions2Hours <= 30 && (
              <li>
                • {t("anime.detail.watchTime.sessions2Hours", {
                  count: sessions2Hours,
                  sessionText: isSpanish
                    ? getPlural(sessions2Hours, "sesión", "sesiones")
                    : getPlural(sessions2Hours, "session", "sessions"),
                  defaultValue: `${sessions2Hours} ${isSpanish ? (sessions2Hours === 1 ? "sesión" : "sesiones") : (sessions2Hours === 1 ? "session" : "sessions")} de 2 horas`,
                })}
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

