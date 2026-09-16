import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from '@phosphor-icons/react';
import { DurationPicker } from './SessionControls';
export default function CareRest({ onElapsed, suspended }) {
  const [duration, setDuration] = useState(60000), [remaining, setRemaining] = useState(60000), [running, setRunning] = useState(false);
  const callback = useRef(onElapsed); callback.current = onElapsed;
  useEffect(() => {
    if (!running || suspended) return;
    let last = performance.now(), left = remaining;
    const id = setInterval(() => {
      if (document.hidden) { setRunning(false); return; }
      const now = performance.now(), delta = Math.min(left, now - last); last = now; left -= delta;
      callback.current(delta); setRemaining(left);
      if (left <= 0) setRunning(false);
    }, 100);
    const hide = () => { if (document.hidden) setRunning(false); };
    document.addEventListener('visibilitychange', hide);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', hide); };
  }, [running, suspended]);
  useEffect(() => { if (suspended) setRunning(false); }, [suspended]);
  const seconds = Math.ceil(remaining / 1000);
  return <div className="care-rest">
    <span className="mini-label">现在可以做</span><h2>放稳腿部，休息一下。</h2>
    <p>坐下或躺在舒服的位置，用软垫托住腿部，自然呼吸。暂时不按揉、不强拉伸。</p>
    <DurationPicker value={duration} onChange={ms => { setRunning(false); setDuration(ms); setRemaining(ms); }} />
    <div className="care-rest-action"><span className="session-clock" aria-label={`休息剩余 ${seconds} 秒`}>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span><button className="primary" onClick={() => { if (!remaining) setRemaining(duration); setRunning(r => !r); }}><span>{running ? '暂停休息' : !remaining ? '再休息一会' : remaining < duration ? '继续休息' : '开始支撑休息'}</span>{running ? <Pause size={18} /> : <Play size={18} />}</button></div>
    <p className="tiny" role="status">{remaining === 0 ? '计时结束，可以保存感受；不代表已适合按摩。' : '随时可以结束。休息时长单独记录，不计作按摩。'}</p>
  </div>;
}
