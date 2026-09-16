import { muscles } from './data.js';
import { MASSAGES, TECHNIQUES } from './massage.js';
import { MOTIONS } from './motions.js';

export const recoveryRegions = ['quads', 'hamstrings', 'outerthigh', 'adductors', 'calves', 'shins', 'outercalf'].map(id => muscles.find(m => m.id === id));
const descriptions = {
  circle: '宽面画小圈，轻柔带动表面', sweep: '掌面慢慢扫过一段肌腹',
  light: '三指指腹轻贴，再缓慢滑过', knead: '整手包住，轻收拢再松开',
  thumb: '宽指腹轻按，不寻找痛点', pin: '仰卧托稳后大腿，小幅伸膝',
};
export function actionsFor(region) {
  if (!MASSAGES[region]) return [];
  const name = muscles.find(m => m.id === region).name;
  const benefits = {
    circle: `用轻柔的小圈扫揉，尝试缓和${name}的紧绷感。`,
    sweep: `用宽掌面缓慢扫过，尝试让${name}的轻微紧绷更舒服。`,
    light: `轻抚${name}的软组织，先感受轻触是否让自己更放松。`,
    knead: '整手轻轻收拢再松开，尝试缓和运动后小腿肚的紧绷感。',
    thumb: '用宽指腹短暂轻贴肌腹，尝试放松；不压出痛感。',
    pin: '让后大腿得到支撑并轻柔活动，尝试缓和紧绷和僵硬感。',
  };
  return [
    ...MASSAGES[region].techniques.map(technique => ({
      id: technique, method: 'massage', technique,
      name: TECHNIQUES[technique].name, summary: descriptions[technique],
      benefit: benefits[technique],
    })),
    { id: 'movement', method: 'movement', name: MOTIONS[region].name, summary: MOTIONS[region].support, benefit: MOTIONS[region].benefit },
  ];
}
export function actionFor(region, id) {
  const actions = actionsFor(region);
  return actions.find(a => a.id === id) || actions[0];
}
export const SESSION_DURATIONS = [30000, 60000, 300000];
export const sessionDuration = value => SESSION_DURATIONS.includes(Number(value)) ? Number(value) : 60000;
export const durationLabel = value => ({30000:'30 秒',60000:'1 分钟',300000:'5 分钟'})[sessionDuration(value)];
export function relaxationPhase(duration, remaining) {
  const elapsed = Math.max(0, duration - remaining);
  return remaining <= 0 ? 'complete' : elapsed >= 30000 ? 'rest' : 'practice';
}
export function tutorialHash(region, action, duration) {
  return `#/tutorial/${region}?action=${actionFor(region, action).id}&duration=${sessionDuration(duration) / 1000}`;
}

// Resolve persisted guided choices against the same action list used by the library.
export function guidedActionFor(draft) {
  const region = draft?.selected || 'quads';
  return actionFor(region, draft?.recoveryAction || (draft?.recoveryMethod === 'movement' ? 'movement' : null));
}
export function configureGuidedRecovery(draft, { actionId, duration = draft.duration } = {}) {
  const action = actionFor(draft.selected, actionId || guidedActionFor(draft).id);
  const nextDuration = sessionDuration(duration);
  return { ...draft, recoveryAction: action.id, recoveryMethod: action.method, duration: nextDuration, remaining: nextDuration,
    practiceMs: draft.practiceMs ?? Math.max(0, sessionDuration(draft.duration) - draft.remaining) };
}
