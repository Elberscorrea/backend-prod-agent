
import { eachDayOfInterval, format, isSameDay, isSaturday, isSunday } from "date-fns";


export function countBusinessDaysInRange(start, end, executedSet = new Set()) {
  let total = 0;
  eachDayOfInterval({ start, end }).forEach(d => {
    if (isSunday(d)) return;
    const iso = d.toISOString().split("T")[0];
    if (executedSet.has(iso)) return;
    total += isSaturday(d) ? 0.5 : 1;
  });
  return total;
}


export function groupByDateKey(array, keyOrFn) {
  return array.reduce((acc, item) => {
    const key = typeof keyOrFn === "function"
      ? keyOrFn(item)
      : item[keyOrFn].toISOString().split("T")[0];
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}


export function isTodayLocal(date, today = new Date()) {
  return isSameDay(new Date(date), today);
}


export function formatISODate(date) {
  return format(new Date(date), "yyyy-MM-dd");
}
