import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Play, Pause, ArrowCounterClockwise } from "@phosphor-icons/react";
import { MOTIONS, movementPose } from "./motions";
import { supineMassagePose } from "./massagePose";
import { createBoundAtlasRig as createAtlasRig } from "./BoundAtlasRig";
import { RIG_VERSION } from "./rigVersion";

function makeStage(scene, selected, side, massagePose = false) {
  const orange = new THREE.MeshStandardMaterial({
    color: 0xff8542,
    metalness: 0.18,
    roughness: 0.38,
    emissive: 0x723008,
    emissiveIntensity: 0.22,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x252d32,
    metalness: 0.3,
    roughness: 0.48,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: 0x66737a,
    metalness: 0.65,
    roughness: 0.35,
  });
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 20);
  const vec = (a) => new THREE.Vector3(...a);
  const link = (a, b, r, material = steel) => {
    const m = new THREE.Mesh(cylinder, material);
    scene.add(m);
    setLink(m, a, b, r);
    return m;
  };
  function setLink(mesh, a, b, r) {
    const from = vec(a),
      to = vec(b),
      delta = to.clone().sub(from);
    mesh.position.copy(from.add(to).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      delta.clone().normalize(),
    );
    mesh.scale.set(r, delta.length(), r);
  }
  const box = (pos, size, mat = dark) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
    m.position.set(...pos);
    scene.add(m);
    return m;
  };
  if (massagePose) {
    box([0, 0.015, 0.12], [0.78, 0.07, 2.05]);
    box([0, 0.095, -0.59], [0.38, 0.09, 0.27], new THREE.MeshStandardMaterial({ color: 0x687980, roughness: 0.9 }));
    return {};
  }
  const seated = MOTIONS[selected].seated;
  const cz = seated ? -0.1 : 0.6;
  const seatY = seated ? 0.385 : 0.465;
  box([0, seatY, cz], [0.49, 0.065, 0.43]);
  box([0, seated ? 0.69 : 0.77, cz - 0.22], [0.48, 0.3, 0.055]);
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      link(
        [sx * 0.21, 0.02, cz + sz * 0.175],
        [sx * 0.21, seatY - 0.015, cz + sz * 0.175],
        0.014,
      );
  for (const sx of [-1, 1])
    link(
      [sx * 0.215, seatY, cz - 0.22],
      [sx * 0.215, seated ? 0.86 : 1.13, cz - 0.22],
      0.012,
    );
  if (!seated) box([0, 1.13, cz - 0.13], [0.5, 0.045, 0.24], steel);
  if (["calves", "shins"].includes(selected)) {
    const x = side === "left" ? 0.12 : -0.12;
    box(
      [x, 0.33, 0.52],
      [0.23, 0.1, 0.3],
      new THREE.MeshStandardMaterial({ color: 0x76818b, roughness: 0.9 }),
    );
    for (const sx of [-1, 1])
      link([x + sx * 0.085, 0.02, 0.53], [x + sx * 0.085, 0.28, 0.53], 0.013);
  }
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(1.08, 1.12, 0.025, 64),
    new THREE.MeshStandardMaterial({
      color: 0x1b2225,
      metalness: 0.2,
      roughness: 0.65,
    }),
  );
  floor.position.set(0, -0.03, 0.28);
  scene.add(floor);
  const grid = new THREE.GridHelper(2.2, 16, 0x3d494d, 0x2a3439);
  grid.position.set(0, -0.012, 0.28);
  scene.add(grid);
  // A trajectory gives direction without pretending to prescribe an exact range.
  const points = [];
  for (let i = 0; i <= 60; i++) {
    const p = movementPose(selected, i / 10, side),
      ankle = vec(p.joints[side + "Ankle"]);
    const tip = new THREE.Vector3(0, -0.055, 0.175).applyEuler(
      new THREE.Euler(p.feet[side].x, 0, p.feet[side].z),
    );
    points.push(ankle.add(tip));
  }
  const path = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineDashedMaterial({
      color: 0xffac74,
      dashSize: 0.026,
      gapSize: 0.014,
      transparent: true,
      opacity: 0.65,
    }),
  );
  path.computeLineDistances();
  scene.add(path);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.05, 16), orange);
  arrow.position.copy(points[15]);
  arrow.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    points[16].clone().sub(points[14]).normalize(),
  );
  scene.add(arrow);
  return {};
}
export default function MovementScene({
  selected,
  side,
  playing = false,
  elapsed = 0,
  controlled = false,
  animationKey = 0,
  compact = false,
  massagePose = false,
  autoDemo = true,
}) {
  const host = useRef(),
    props = useRef(),
    api = useRef();
  const [demo, setDemo] = useState(
    () =>
      autoDemo && elapsed === 0 &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [view, setView] = useState("angle"),
    [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0);
  const [cue, setCue] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const motion = massagePose ? { name: "仰卧托腿屈伸", support: "仰卧垫上 · 双手托住后大腿", seated: false, cue: ["双手轻贴托腿，伸膝一点", "慢慢弯回，放松"] } : MOTIONS[selected];
  props.current = { playing, elapsed, demo, view, animationKey };
  useEffect(() => {
    if (playing) setDemo(false);
  }, [playing]);
  useEffect(() => {
    let renderer,
      frame,
      disposed = false,
      atlasRig;
    const el = host.current;
    setFailed(false);
    setLoaded(false);
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x101417, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      `${motion.name}的全身三维示范，包含${motion.support}`,
    );
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(32, 1, 0.01, 30);
    scene.add(new THREE.HemisphereLight(0xe9f4ff, 0x685744, 2.7));
    for (const [pos, color, intensity] of [
      [[2, 3, 3], 0xffffff, 3],
      [[-3, 2, -1], 0xffaf78, 2],
    ]) {
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(...pos);
      scene.add(light);
    }
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minDistance = 1.6;
    controls.maxDistance = 5;
    controls.minPolarAngle = 0.3;
    controls.maxPolarAngle = 1.7;
    const target = massagePose ? new THREE.Vector3(0, 0.35, -0.03) : new THREE.Vector3(0, motion.seated ? 0.64 : 0.9, 0.23);
    controls.target.copy(target);
    function setCamera(v) {
      const sign = side === "right" ? -1 : 1;
      const dir =
        v === "front"
          ? new THREE.Vector3(0.06, 0.12, 1)
          : v === "side"
            ? new THREE.Vector3(sign, 0.1, 0.08)
            : new THREE.Vector3(sign * 0.9, massagePose ? 0.70 : 0.35, massagePose ? 0.65 : 1.25);
      camera.position
        .copy(target)
        .add(dir.normalize().multiplyScalar(massagePose ? 2.25 : motion.seated ? compact ? 2.4 : 2.95 : compact ? 3.3 : 3.9));
      controls.update();
    }
    let lastView = props.current.view;
    setCamera(lastView);
    makeStage(scene, MOTIONS[selected]?.clipRegion || selected, side, massagePose);
    createAtlasRig(scene, selected, side, () => disposed, massagePose ? supineMassagePose : movementPose)
      .then((rig) => {
        atlasRig = rig;
        if (rig) setLoaded(true);
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    const resize = () => {
      const r = el.getBoundingClientRect();
      const maxDpr = Math.min(devicePixelRatio || 1, 1.5);
      const pixelDpr = Math.sqrt(2000000 / Math.max(1, r.width * r.height));
      renderer.setPixelRatio(Math.max(1, Math.min(maxDpr, pixelDpr)));
      renderer.setSize(r.width, r.height);
      camera.aspect = r.width / Math.max(r.height, 1);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    let last = 0,
      demoTime = 0,
      lastKey = animationKey,
      lastElapsed = 0,
      inputTime = 0,
      lastCue = -1;
    api.current = {
      reset: () => {
        demoTime = 0;
        setCamera(props.current.view);
      },
    };
    const onLost = (e) => {
      e.preventDefault();
      setFailed(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", onLost);
    function animate(now) {
      frame = requestAnimationFrame(animate);
      if (document.hidden || now - last < 30) return;
      const dt = Math.min((now - last) / 1000, 0.06);
      last = now;
      const p = props.current;
      if (lastView !== p.view) {
        setCamera(p.view);
        lastView = p.view;
      }
      if (lastKey !== p.animationKey) {
        demoTime = 0;
        lastKey = p.animationKey;
      }
      if (p.elapsed !== lastElapsed) {
        lastElapsed = p.elapsed;
        inputTime = now;
      }
      if (p.demo && !p.playing) demoTime += dt;
      const t = p.playing
        ? p.elapsed / 1000 + Math.min((now - inputTime) / 1000, 0.1)
        : p.demo
          ? demoTime
          : p.elapsed > 0
            ? p.elapsed / 1000
            : demoTime;
      atlasRig?.update(t);
      const c = t % 6 < 3 ? 0 : 1;
      if (c !== lastCue) {
        lastCue = c;
        setCue(c);
      }
      controls.update();
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      atlasRig?.dispose();
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      const gs = new Set(),
        ms = new Set();
      scene.traverse((o) => {
        if (o.geometry) gs.add(o.geometry);
        if (o.material) {
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            ms.add(m);
        }
      });
      gs.forEach((g) => g.dispose());
      ms.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      renderer.domElement.remove();
      api.current = null;
    };
  }, [selected, side, retry, massagePose, compact, RIG_VERSION]);
  return (
    <div className={"movement-scene " + (compact ? "compact-demo" : "")}>
      <div className="movement-canvas" ref={host} />
      <div className="movement-tag">
        <span className="orange-dot" /> {side === "right" ? "右侧" : "左侧"} ·{" "}
        {motion.support}
      </div>
      <div className="motion-phase">
        {playing || demo ? motion.cue[cue] : "示范已暂停"}
        <small>
          {playing
            ? "跟练中 · 与计时同步"
            : demo
              ? "示范播放 · 不计时"
              : "拖动可旋转查看姿势"}
        </small>
      </div>
      {!loaded && !failed && (
        <div className="scene-status">
          <p>正在载入 Human Atlas 动作模型…</p>
        </div>
      )}
      {failed && (
        <div className="scene-status">
          <p>3D 暂时不可用，动作步骤仍可查看。</p>
          <button onClick={() => setRetry((r) => r + 1)}>重新加载示范</button>
        </div>
      )}
      <div className="movement-controls">
        <div>
          {[
            ["angle", "立体"],
            ["front", "正面"],
            ["side", "侧面"],
          ].map(([id, name]) => (
            <button
              key={id}
              aria-pressed={view === id}
              onClick={() => setView(id)}
            >
              {name}
            </button>
          ))}
        </div>
        <div>
          {!playing && !controlled && (
            <button
              onClick={() => setDemo((v) => !v)}
              aria-label={demo ? "暂停动作示范" : "播放动作示范"}
            >
              {demo ? <Pause size={17} /> : <Play size={17} />}
            </button>
          )}
          <button
            aria-label="重置动作视角"
            onClick={() => api.current?.reset()}
          >
            <ArrowCounterClockwise size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
