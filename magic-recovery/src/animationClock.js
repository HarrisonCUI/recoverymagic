// Smooth between the course's 100 ms timer updates without running ahead of it.
// Pausing returns the exact supplied time; a reset never retains the old clip time.
export function createAnimationClock() {
  let previous, receivedAt=0, wasPlaying=false;
  return (elapsedMs, playing, now) => {
    if (elapsedMs!==previous || playing!==wasPlaying) {
      previous=elapsedMs;receivedAt=now;wasPlaying=playing;
    }
    return (elapsedMs+(playing?Math.min(100,Math.max(0,now-receivedAt)):0))/1000;
  };
}
