import { useEffect, useState } from "react";
import MovementScene from "./MovementScene";
import LegScene from "./LegScene";
import { muscles } from "./data";
export default function MassageScene({
  selected,
  side,
  playing = false,
  animationKey = 0,
  technique = "light",
  elapsed = 0,
  autoDemo = true,
  controlled = false,
}) {
  const [view, setView] = useState(muscles.find((m) => m.id === selected).view);
  const [demo, setDemo] = useState(
    () => autoDemo && !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    setView(muscles.find((m) => m.id === selected).view);
  }, [selected]);
  useEffect(() => {
    if (playing) setDemo(false);
  }, [playing]);
  if (technique === "pin") return <div className="supine-massage-scene"><MovementScene selected={selected} side={side} playing={playing} animationKey={animationKey} elapsed={elapsed} autoDemo={autoDemo} controlled={controlled} massagePose /></div>;
  return (
    <div className="massage-scene scene-slot">
      <LegScene
        selected={selected}
        technique={technique}
        side={side}
        onSelect={() => {}}
        view={view}
        setView={setView}
        mode="massage"
        touchStep={1}
        animationKey={animationKey}
        playback={playing || demo}
        onPlaybackToggle={() => setDemo((v) => !v)}
        hidePlaybackControl={playing || controlled}
        elapsedMs={controlled ? elapsed : undefined}
      />
      <div className="massage-demo-tag">
        {["knead", "thumb"].includes(technique) ? "手法示意 · 青色点为接触范围" : playing ? "跟练中 · 手法示意" : selected === "hamstrings" ? "坐姿支撑 · 肌腹近景" : "坐稳放松腿部 · 肌腹近景"}
      </div>
    </div>
  );
}
