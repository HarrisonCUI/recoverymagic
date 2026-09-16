// Presentation follows course time, including pause/resume. It never adds activity time.
const smooth = value => { const t=Math.max(0,Math.min(1,value)); return t*t*(3-2*t); };
const cycleMs = action => action.method === 'massage' && action.technique !== 'pin' ? 8000 : 6000;
export function routinePresentation(state) {
  const previous = [...state.steps.slice(0,state.index)].reverse().find(s=>s.action);
  if(state.phase === 'transition') {
    const t=state.elapsed;
    // Let the completed gesture release before changing the model/hand shape.
    if(t<600) return {action:previous.action,elapsed:previous.ms,animate:false,opacity:1-smooth(t/500),mode:'release'};
    const cycle=cycleMs(state.action),previewStart=state.step.ms-cycle;
    // Only preview a complete cycle, so formal practice starts at the same ready pose.
    const preview=previewStart>=1500 && t>=previewStart;
    return {action:state.action,elapsed:preview?t-previewStart:0,animate:preview,
      opacity:smooth((t-850)/650),mode:preview?'preview':'ready'};
  }
  if(state.phase === 'prepare') {
    const cycle=cycleMs(state.action);
    return {action:state.action,elapsed:state.elapsed+(cycle-state.step.ms%cycle)%cycle,animate:true,opacity:1,mode:'preview'};
  }
  if(state.phase === 'practice') return {action:state.action,elapsed:state.elapsed,animate:true,opacity:1,mode:'practice'};
  return {action:state.action,elapsed:previous?.ms || 0,animate:false,opacity:1,mode:'rest'};
}
