import { actionFor, sessionDuration } from './recoveryCatalog.js';

// Course pacing is editorial, not a treatment dose. Preserve v1 for saved history.
export const ROUTINE_VERSION = 2;
const sequences = {
  quads: ['light', 'circle', 'sweep', 'movement', 'light', 'sweep'],
  hamstrings: ['light', 'sweep', 'movement', 'light', 'sweep', 'movement'],
  calves: ['light', 'knead', 'sweep', 'thumb', 'light', 'movement'],
  adductors: ['light', 'sweep', 'movement', 'light', 'sweep', 'movement'],
  outerthigh: ['light', 'sweep', 'movement', 'light', 'sweep', 'movement'],
  shins: ['light', 'movement', 'light', 'movement', 'light', 'movement'],
  outercalf: ['light', 'sweep', 'movement', 'light', 'sweep', 'movement'],
};
function legacyRoutine(region, requestedDuration) {
  const duration = sessionDuration(requestedDuration), ids = sequences[region] || sequences.quads;
  const short = duration === 30000, long = duration === 300000;
  const chosen = long ? ids : region === 'quads' ? ['circle', 'sweep'] : ids.slice(0, 2);
  const steps = [], add = (kind, ms, title, action = null) => steps.push({ id: `step-${steps.length}`, kind, ms, title, action });
  add('prepare', long ? 8000 : short ? 4000 : 6000, '坐稳或躺稳，让腿有支撑');
  chosen.forEach((id, i) => {
    const action = actionFor(region, id);
    add('action', long ? 24000 : short ? 8000 : 16000, action.name, action);
    if (i < chosen.length - 1) add('transition', long ? 16000 : short ? 2000 : 6000, '松手，准备下一个动作');
  });
  add('rest', duration - steps.reduce((sum, step) => sum + step.ms, 0), '松手休息，感受变化');
  let at = 0;
  return steps.map(step => { const start = at; at += step.ms; return { ...step, start, end: at }; });
}
export function recoveryRoutine(region, requestedDuration, version = ROUTINE_VERSION) {
  if(version === 1) return legacyRoutine(region, requestedDuration);
  const duration=sessionDuration(requestedDuration), short=duration<=60000;
  const main=region==='quads'?['circle','sweep','light']:(sequences[region]||sequences.quads).slice(0,3);
  const chosen=short?[main[0]]:duration===180000?main:[...main,...main];
  const steps=[], add=(kind,ms,title,action=null)=>steps.push({id:`step-${steps.length}`,kind,ms,title,action});
  add('prepare',duration===30000?4000:short?6000:8000,'坐稳或躺稳，让腿有支撑');
  chosen.forEach((id,i)=>{
    const action=actionFor(region,id);
    add('action',duration===30000?16000:duration===180000?48000:action.method==='movement'?36000:40000,action.name,action);
    if(i<chosen.length-1)add('transition',8000,'松手，准备下一个动作');
  });
  add('rest',duration-steps.reduce((n,s)=>n+s.ms,0),'松手休息，感受变化');
  let at=0;
  return steps.map(s=>{const start=at;at+=s.ms;return {...s,start,end:at};});
}
export function routineState(region, duration, remaining) {
  const steps = recoveryRoutine(region, duration), elapsed = Math.min(sessionDuration(duration), Math.max(0, sessionDuration(duration) - remaining));
  const complete = remaining <= 0, index = complete ? steps.length - 1 : steps.findIndex(step => elapsed < step.end);
  const step = steps[index], upcoming = steps.slice(index + 1).find(s => s.kind === 'action');
  const actionStep = step.action ? step : upcoming || [...steps.slice(0, index)].reverse().find(s => s.action);
  return { steps, index, step, complete, action: actionStep.action, next: upcoming, elapsed: elapsed - step.start,
    phase: complete ? 'complete' : step.kind === 'action' ? 'practice' : step.kind,
    remaining: Math.max(0, step.end - elapsed),
    actionNumber: steps.slice(0, index + 1).filter(s => s.kind === 'action').length,
    actionCount: steps.filter(s => s.kind === 'action').length };
}
export function advanceRoutine(draft, delta) {
  const duration = sessionDuration(draft.duration), remaining = Math.max(0, draft.remaining - Math.max(0, delta));
  const start = duration - draft.remaining, end = duration - remaining;
  const log = { ...(draft.routineLog || {}) };
  let active = 0;
  for (const step of recoveryRoutine(draft.selected, duration)) {
    if (step.kind !== 'action') continue;
    const overlap = Math.max(0, Math.min(end, step.end) - Math.max(start, step.start));
    if (overlap) { active += overlap; log[step.id] = (log[step.id] || 0) + overlap; }
  }
  return { ...draft, remaining, practiceMs: (draft.practiceMs || 0) + active, routineLog: log };
}
export function routineRecord(draft) {
  return recoveryRoutine(draft.selected, draft.duration, draft.routineVersion).filter(s => s.action).map(s => ({ name: s.title, action: s.action.id, plannedSeconds: s.ms / 1000, seconds: Math.round((draft.routineLog?.[s.id] || 0) / 1000) }));
}
