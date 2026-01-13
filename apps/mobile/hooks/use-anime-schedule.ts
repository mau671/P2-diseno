import { useQuery } from '@tanstack/react-query';
import { fetchScheduleForDate, fetchScheduleByWeekday } from '@/lib/api/schedule';
import type { ScheduleItem } from '@/lib/api/types';

export type { ScheduleItem };

const CACHE_TTL = 5 * 60 * 1000;

export function useAnimeSchedule(date: Date) {
  return useQuery({
    queryKey: ['schedule', date.toISOString()],
    queryFn: () => fetchScheduleForDate(date),
    staleTime: CACHE_TTL,
    gcTime: CACHE_TTL,
  });
}

export function useScheduleForWeekday(weekday: string) {
  return useQuery({
    queryKey: ['schedule', weekday],
    queryFn: async () => {
      const items = await fetchScheduleByWeekday(weekday as ScheduleItem['weekday']);
      
      const itemsWithCRTime = items.map(item => {
        if (!item.broadcastTime) {
          return { ...item, timeLabelCR: null };
        }
        
        const timeLabelCR = formatJikanTimeToCR(item.broadcastTime);
        
        return { ...item, timeLabelCR };
      });
      
      return itemsWithCRTime.sort((a, b) => {
        if (a.timeLabelCR === null && b.timeLabelCR === null) return 0;
        if (a.timeLabelCR === null) return 1;
        if (b.timeLabelCR === null) return -1;
        return a.timeLabelCR.localeCompare(b.timeLabelCR);
      });
    },
    staleTime: CACHE_TTL,
    gcTime: CACHE_TTL,
  });
}

function formatJikanTimeToCR(jikanTime: string): string {
  const timeMatch = jikanTime.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) return jikanTime;
  
  const hourJST = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);
  
  const JST_OFFSET = 9;
  const CR_OFFSET = -6;
  const diffHours = JST_OFFSET - CR_OFFSET;
  
  let hourCR = hourJST - diffHours;
  if (hourCR < 0) hourCR += 24;
  if (hourCR >= 24) hourCR -= 24;
  
  const hourStr = hourCR.toString().padStart(2, '0');
  const minuteStr = timeMatch[2];
  
  return `${hourStr}:${minuteStr}`;
}
