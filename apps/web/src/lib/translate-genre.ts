/**
 * Translates a genre name using its mal_id.
 * Falls back to the original name if translation is not available.
 */
export function translateGenre(
  t: (key: string, options?: Record<string, unknown>) => string,
  genre: { mal_id: number; name: string }
): string {
  return t(`genres.${genre.mal_id}`, { defaultValue: genre.name });
}

