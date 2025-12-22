export type SeasonType = "winter" | "spring" | "summer" | "fall";

export type SeasonInfo = {
  year: number;
  season: SeasonType;
};

//Obtiene la temporada actual basada en la fecha
export function getCurrentSeason(): SeasonInfo {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  let season: SeasonType;
  if (month >= 1 && month <= 3) season = "winter";
  else if (month >= 4 && month <= 6) season = "spring";
  else if (month >= 7 && month <= 9) season = "summer";
  else season = "fall";

  return { year, season };
}

//Obtiene la temporada anterior
export function getPreviousSeason(year: number, season: SeasonType): SeasonInfo {
  const seasons: SeasonType[] = ["winter", "spring", "summer", "fall"];
  const currentIndex = seasons.indexOf(season);
  
  if (currentIndex === 0) {
    return { year: year - 1, season: "fall" };
  } else {
    return { year, season: seasons[currentIndex - 1] };
  }
}

//Obtiene la siguiente temporada
export function getNextSeason(year: number, season: SeasonType): SeasonInfo {
  const seasons: SeasonType[] = ["winter", "spring", "summer", "fall"];
  const currentIndex = seasons.indexOf(season);
  
  if (currentIndex === 3) {
    return { year: year + 1, season: "winter" };
  } else {
    return { year, season: seasons[currentIndex + 1] };
  }
}


//Verifica si una temporada es futura
 
export function isSeasonInFuture(year: number, season: SeasonType): boolean {
  const current = getCurrentSeason();
  if (year > current.year) return true;
  if (year < current.year) return false;
  
  const seasons: SeasonType[] = ["winter", "spring", "summer", "fall"];
  const currentIndex = seasons.indexOf(current.season);
  const checkIndex = seasons.indexOf(season);
  
  return checkIndex > currentIndex;
}