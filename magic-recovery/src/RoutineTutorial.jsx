import { useEffect, useState, useRef } from 'react';
import GuidedRecovery, { RoutineSteps } from './GuidedRecovery';
import { muscles } from './data';
import { sessionDuration } from './recoveryCatalog';
import { advanceRoutine, routineState } from './recoveryRoutine';
import { MassageDetails } from './MassageGuidance';
import { tutorialFor } from './tutorial';
import { Play, Pause } from '@phosphor-icons/react';
export default function RoutineTutorial({ selected, initialDuration, initialSide, onConfig, suspended, onSave, startRequest = 0 }) {
  const [session, setSession] = useState(() => ({ id: crypto.randomUUID(), selected, duration: sessionDuration(initialDuration), remaining: sessionDuration(initialDuration), practiceMs: 0 }));
  const [running, setRunning] = useState(Boolean(startRequest)), [details, setDetails] = useState(null), [key, setKey] = useState(0);
  const [side, setSide] = useState(initialSide || 'right');
  const region = muscles.find(m => m.id === selected), state = routineState(selected, session.duration, session.remaining);
  const consumedStart = useRef(0), configured = useRef(null);
  useEffect(() => { const config = `${selected}:${initialDuration}:${startRequest}`; if(configured.current === config) return; configured.current = config; const start = startRequest > 0 && consumedStart.current !== startRequest; consumedStart.current = startRequest; setRunning(start); setSession({id: crypto.randomUUID(), selected, duration: sessionDuration(initialDuration), remaining: sessionDuration(initialDuration), practiceMs:0}); }, [selected, initialDuration, startRequest]);
  useEffect(() => {
    if (!running || suspended || details) return;
    let last = performance.now();
    const id = setInterval(() => { if (document.hidden) {setRunning(false); return;} const now = performance.now(), delta = now - last; last = now; setSession(s => advanceRoutine(s, delta)); }, 100);
    const hide = () => { if (document.hidden) setRunning(false); }; document.addEventListener('visibilitychange', hide);
    return () => {clearInterval(id); document.removeEventListener('visibilitychange', hide);};
  }, [running, suspended, details]);
  useEffect(() => {if (session.remaining === 0 || suspended || details) setRunning(false);}, [session.remaining, suspended, details]);
  function configure(duration) {setRunning(false); setSession({id: crypto.randomUUID(),selected,duration,remaining:duration,practiceMs:0}); setKey(k=>k+1); onConfig?.('routine',duration);}
  return <div className="routine-tutorial">
    <GuidedRecovery region={region} side={side} duration={session.duration} remaining={session.remaining} playing={running} animationKey={key} onDuration={configure} onChooseAction={()=>setDetails('plan')} onDetails={()=>setDetails('action')} />
    <div className="routine-controls"><div><span className="session-clock">{Math.floor(Math.ceil(session.remaining/1000)/60)}:{String(Math.ceil(session.remaining/1000)%60).padStart(2,'0')}</span><button className="primary" onClick={()=>{if (!session.remaining) onSave?.(session,side); else setRunning(r=>!r);}}><span>{!session.remaining ? '完成并记录' : running ? '暂停跟练' : session.remaining < session.duration ? '继续跟练' : '开始自动跟练'}</span>{running ? <Pause size={18}/> : <Play size={18}/>}</button></div><div className="routine-secondary">{session.remaining > 0 && <button className="text-button" onClick={()=>{setRunning(false); onSave?.(session,side);}}>结束并记录</button>}<button className="text-button" onClick={()=>{setSide(s=>s==='right'?'left':'right'); configure(session.duration);}}>换到{side==='right'?'左':'右'}腿</button></div></div>
    {details && <RoutineOverlay onClose={()=>setDetails(null)} title={details==='plan'?'自动跟练顺序':'动作要点'}>{details==='plan' ? <RoutineSteps region={selected} duration={session.duration} remaining={session.remaining}/> : state.action.method==='massage' ? <MassageDetails selected={selected} technique={state.action.technique}/> : tutorialFor(region).steps.map(s=><p key={s.title}>{s.title}：{s.body}</p>)}</RoutineOverlay>}
  </div>;
}

function RoutineOverlay({ title, children, onClose }) {
  const ref = useRef();
  useEffect(() => { const previous = document.activeElement; ref.current.showModal(); return () => previous?.focus?.(); }, []);
  return <dialog className="sheet routine-details" ref={ref} onCancel={onClose} onClick={e => {if (e.target === ref.current) onClose();}} aria-label={title}><div className="sheet-title"><h2>{title}</h2><button onClick={onClose} aria-label="关闭跟练详情">×</button></div>{children}</dialog>;
}
