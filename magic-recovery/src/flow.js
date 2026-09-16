import { routineRecord, ROUTINE_VERSION } from "./recoveryRoutine.js";
import { muscles, assess } from "./data.js";
import { sessionDuration, actionFor, guidedActionFor } from "./recoveryCatalog.js";
export const FLOW = [
  "activity",
  "location",
  "safety",
  "touch",
  "feeling",
  "result",
  "recovery",
  "care",
  "feedback",
  "complete",
];
export const initialDraft = (seed = {}) => ({
  id: crypto.randomUUID(),
  screen: "location",
  sport: seed.sport || "跑步",
  selected: seed.selected || "quads",
  side: seed.side || "right",
  flags: [],
  safeNone: false,
  pain: 3,
  symptom: "",
  onset: "",
  touchStep: 1,
  recoveryStep: 1,
  recoveryMethod: "massage",
  routineVersion: ROUTINE_VERSION,
  routineLog: {},
  recoveryAction: actionFor(seed.selected || "quads").id,
  careStep: 0,
  careNote: "",
  careRestMs: 0,
  stopped: false,
  remaining: 60000,
  duration: 60000,
  after: 3,
  referenceId: seed.referenceId || null,
  startedAt: new Date().toISOString(),
});
export function canEnter(screen, d) {
  if (
    !d ||
    !muscles.some((m) => m.id === d.selected) ||
    !["left", "right"].includes(d.side)
  )
    return false;
  if (["activity", "location", "safety"].includes(screen)) return true;
  const safe = !d.flags.length && !d.stopped;
  if (screen === "touch" || screen === "feeling") return safe;
  if (screen === "result")
    return (
      d.flags.length > 0 || d.stopped || (safe && !!d.symptom && !!d.onset)
    );
  if (screen === "care") return canEnter("result", d) && !assess(d).allow;
  if (["recovery", "feedback", "complete"].includes(screen))
    return safe && !!d.symptom && !!d.onset && assess(d).allow;
  return false;
}
export function validateDraft(d) {
  if (
    !d ||
    typeof d.id !== "string" ||
    !FLOW.includes(d.screen) ||
    !Array.isArray(d.flags) ||
    !Number.isFinite(d.pain) ||
    d.pain < 0 ||
    d.pain > 10 ||
    !Number.isFinite(d.remaining) ||
    d.remaining < 0 ||
    d.remaining > sessionDuration(d.duration)
  )
    return null;
  if (!canEnter(d.screen, d)) return null;
  const action = guidedActionFor({ ...d, recoveryMethod: d.recoveryMethod || "movement" });
  return {
    ...d,
    recoveryAction: action.id,
    routineVersion: ROUTINE_VERSION,
    routineLog: d.routineVersion === ROUTINE_VERSION && d.routineLog && typeof d.routineLog === "object" ? Object.fromEntries(Object.entries(d.routineLog).filter(([key, ms]) => /^step-\d+$/.test(key) && Number.isFinite(ms) && ms >= 0)) : {},
    routineHistory: [...(Array.isArray(d.routineHistory) ? d.routineHistory.filter(s => s && typeof s.name === "string" && Number.isFinite(s.seconds) && s.seconds >= 0) : []), ...(d.routineVersion === 1 ? routineRecord(d).filter(s => s.seconds > 0) : [])].slice(-100),
    remaining: d.routineVersion === ROUTINE_VERSION ? d.remaining : sessionDuration(d.duration),
    duration: sessionDuration(d.duration),
    practiceMs: Number.isFinite(d.practiceMs) && d.practiceMs >= 0 ? d.practiceMs : Math.max(0, sessionDuration(d.duration) - d.remaining),
    screen:
      d.screen === "activity"
        ? "location"
        : ["feeling", "safety"].includes(d.screen)
          ? d.flags.length || d.stopped
            ? "care"
            : "touch"
          : d.screen === "result"
            ? assess(d).allow
              ? "recovery"
              : "care"
            : d.screen,
    careStep: [0, 1, 2].includes(d.careStep) ? d.careStep : 0,
    careRestMs: Number.isFinite(d.careRestMs) && d.careRestMs >= 0 ? d.careRestMs : 0,
    careNote: typeof d.careNote === "string" ? d.careNote.slice(0, 500) : "",
    recoveryStep: 1,
    recoveryMethod: action.method,
    touchStep: d.touchStep === 2 ? 2 : 1,
  };
}
export function nextScreen(d) {
  switch (d.screen) {
    case "activity":
      return "location";
    case "location":
      return d.flags.length || d.stopped ? "care" : "touch";
    case "safety":
      return d.flags.length || d.stopped ? "care" : "touch";
    case "touch":
      return d.symptom && d.onset
        ? assess(d).allow
          ? "recovery"
          : "care"
        : null;
    case "feeling":
      return d.symptom && d.onset
        ? assess(d).allow
          ? "recovery"
          : "care"
        : null;
    case "result":
      return canEnter("recovery", d)
        ? "recovery"
        : canEnter("care", d)
          ? "care"
          : null;
    case "care":
      return "complete";
    case "recovery":
      return "feedback";
    case "feedback":
      return "complete";
    default:
      return null;
  }
}
export function previousScreen(d) {
  const back = {
    location: null,
    safety: "location",
    touch: "location",
    feeling: "touch",
    result: d.flags.length ? "safety" : "feeling",
    recovery: "touch",
    care: "location",
    feedback: "recovery",
  };
  return back[d.screen] || null;
}
export function makeRecord(d, { stopOnly = false } = {}) {
  const m = muscles.find((m) => m.id === d.selected),
    r = assess(d);
  return {
    id: d.id,
    date: new Date().toISOString(),
    region: m.name,
    anatomy: m.anatomy,
    selected: d.selected,
    side: d.side,
    sport: d.sport,
    pain: d.symptom ? d.pain : null,
    symptom: d.symptom,
    onset: d.onset,
    flags: d.flags,
    stopped: !!d.stopped,
    carePlan: d.screen === "care" ? r.kind : null,
    careNote: d.screen === "care" ? (d.careNote || "").slice(0, 500) : "",
    careRestSeconds: Math.round(Math.max(0, d.careRestMs || 0) / 1000),
    result: r.title,
    after: stopOnly ? null : d.after,
    seconds: Math.round((d.practiceMs ?? (sessionDuration(d.duration) - d.remaining)) / 1000),
    plannedSeconds: sessionDuration(d.duration) / 1000,
    recoveryAction: d.routineVersion === ROUTINE_VERSION ? "routine" : guidedActionFor(d).id,
    recoveryActionName: d.screen === "care" ? null : d.routineVersion === ROUTINE_VERSION ? "自动跟练" : guidedActionFor(d).name,
    routineSteps: d.screen !== "care" && d.routineVersion === ROUTINE_VERSION ? [...(d.routineHistory || []), ...routineRecord(d)] : [],
    referenceId: d.referenceId || null,
  };
}
export function upsertRecord(records, item) {
  return [item, ...records.filter((r) => r.id !== item.id)].slice(0, 100);
}
