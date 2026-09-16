import { muscles } from "./data.js";
export const PREFERENCE_KEY = "magic-preferences-v1";
const sports = ["跑步", "骑行", "力量", "徒步"];
const valid = (v) =>
  v &&
  muscles.some((m) => m.id === v.selected) &&
  ["left", "right"].includes(v.side) &&
  sports.includes(v.sport);
export function cleanPreferences(value) {
  return {
    last: valid(value?.last)
      ? {
          selected: value.last.selected,
          side: value.last.side,
          sport: value.last.sport,
        }
      : null,
    choices: Array.isArray(value?.choices)
      ? value.choices
          .filter((v) => valid(v) && Number.isFinite(v.count) && v.count > 0)
          .slice(0, 40)
          .map((v) => ({
            selected: v.selected,
            side: v.side,
            sport: v.sport,
            count: Math.min(v.count, 10000),
          }))
      : [],
    seen: Array.isArray(value?.seen)
      ? value.seen.filter((v) => typeof v === "string").slice(-100)
      : [],
  };
}
export function rememberChoice(previous, draft) {
  const prefs = cleanPreferences(previous);
  if (!valid(draft)) return prefs;
  const last = {
    selected: draft.selected,
    side: draft.side,
    sport: draft.sport,
  };
  const event = `${draft.id}:${draft.selected}:${draft.side}:${draft.sport}`;
  if (prefs.seen.includes(event)) return { ...prefs, last };
  const choices = [...prefs.choices];
  const index = choices.findIndex(
    (v) =>
      v.selected === last.selected &&
      v.side === last.side &&
      v.sport === last.sport,
  );
  if (index < 0) choices.push({ ...last, count: 1 });
  else
    choices[index] = {
      ...choices[index],
      count: Math.min(choices[index].count + 1, 10000),
    };
  return { last, choices, seen: [...prefs.seen, event].slice(-100) };
}
export function frequentRegions(prefs) {
  const groups = new Map();
  for (const v of cleanPreferences(prefs).choices) {
    const key = `${v.selected}:${v.side}`;
    groups.set(key, { ...v, count: v.count + (groups.get(key)?.count || 0) });
  }
  return [...groups.values()].sort((a, b) => b.count - a.count).slice(0, 3);
}
export function loadPreferences(records = []) {
  try {
    const raw = localStorage.getItem(PREFERENCE_KEY);
    if (raw !== null) return cleanPreferences(JSON.parse(raw));
  } catch {
    return cleanPreferences(null);
  }
  return [...records]
    .reverse()
    .reduce((p, r) => rememberChoice(p, r), cleanPreferences(null));
}
