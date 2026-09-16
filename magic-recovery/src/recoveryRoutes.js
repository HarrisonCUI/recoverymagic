import { canEnter, FLOW, validateDraft } from './flow.js';
import { muscles } from './data.js';
import { actionFor, sessionDuration } from './recoveryCatalog.js';
const regions = new Set(muscles.map(m => m.id));
// Public lessons never create or overwrite an assessment draft.
export function publicRoute(hash) {
  const [path, query = ''] = String(hash).split('?');
  const match = path.match(/^#\/(tutorial|library)\/([a-z]+)$/);
  if (match && regions.has(match[2])) {
    if (match[1] === 'library') return { magicPage: 'library', libraryRegion: match[2] };
    const params = new URLSearchParams(query);
    const route = { magicPage: 'tutorial', lessonRegion: match[2] };
    if (query) { route.lessonAction = actionFor(match[2], params.get('action')).id; route.lessonDuration = sessionDuration(Number(params.get('duration')) * 1000); }
    return route;
  }
  return { magicPage: path === '#/library' ? 'library' : 'home' };
}
export function tutorialCareContext(draft, selected) {
  return draft?.screen === 'care' && draft.selected === selected && canEnter('care', draft)
    ? { draftId: draft.id, side: draft.side } : null;
}

// Refresh restores only a valid saved session; a URL cannot manufacture an assessment.
export function appRoute(hash, draft) {
  const page = String(hash).replace(/^#\//, '').split('?')[0];
  if (FLOW.includes(page) && page !== 'complete') {
    const saved = validateDraft(draft);
    if (saved) {
      if (saved.screen === 'care' && !['location', 'activity'].includes(page)) return { magicPage: 'care' };
      const requested = validateDraft({ ...saved, screen: page });
      return { magicPage: requested?.screen || saved.screen };
    }
  }
  return publicRoute(hash);
}
