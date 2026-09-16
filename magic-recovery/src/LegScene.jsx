import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  ArrowsClockwise,
  Minus,
  Plus,
  WarningCircle,
  Play,
  Pause,
} from "@phosphor-icons/react";
import { muscles } from "./data";
import { createTouchHand, touchPhase } from "./touchGuide";
import { massagePhase, MASSAGES, TECHNIQUES } from "./massage";
import { loadBufferAsset, loadJsonAsset } from "./assetLoader";
import { createCalfSurface } from "./BoundMassageHand";
import { createSchematicMassageHand } from "./SchematicMassageHand";
import { massageAnchor, massageMeshes, sampleMassagePath } from "./massageGeometry";
import { createAnimationClock } from "./animationClock";

export default function LegScene({
  selected,
  side,
  onSelect,
  view,
  setView,
  mode = "explore",
  playing = false,
  xray = false,
  animationKey = 0,
  touchStep = 0,
  playback,
  onPlaybackToggle,
  hidePlaybackControl = false,
  technique = "light",
  elapsedMs,
}) {
  const [touchPlaying, setTouchPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [touchLabel, setTouchLabel] = useState("找到这片区域");
  const host = useRef(),
    api = useRef(),
    props = useRef();
  props.current = {
    selected,
    side,
    onSelect,
    view,
    mode,
    playing,
    xray,
    animationKey,
    touchStep,
    technique,
    elapsedMs,
    touchPlaying: playback ?? touchPlaying,
  };
  const [status, setStatus] = useState("loading"),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let disposed = false,
      frame,
      renderer,
      controls;
    const abort = new AbortController();
    const meshes = [];
    const el = host.current;
    setStatus("loading");
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      setStatus("error");
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x090909, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = props.current.mode === "hero" ? 1.08 : 1.4;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "可旋转的腿部肌肉三维模型；也可使用部位按钮选择",
    );
    const hero = props.current.mode === "hero";
    const scene = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(33, 1, 0.01, 50);
    camera.position.set(0.4, 0.65, 2.05);
    if (hero) camera.up.set(0, 1, 0);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.52, 0);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minDistance = 0.35;
    controls.maxDistance = 2.8;
    controls.maxPolarAngle = Math.PI * 0.82;
    controls.minPolarAngle = 0.3;
    scene.add(new THREE.HemisphereLight(0xd9e5ff, 0x554d42, 2.7));
    const key = new THREE.DirectionalLight(0xffffff, 3.8);
    key.position.set(-2, 3, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffb27a, 2.2);
    rim.position.set(2, 1, -2);
    if (hero) { rim.color.set(0x66cbff); rim.intensity = 4.2; }
    scene.add(rim);
    const back = new THREE.DirectionalLight(0xeff5ff, 2.8);
    back.position.set(-2, 1, -3);
    scene.add(back);
    const stage = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.27, 0.012, 96),
      new THREE.MeshStandardMaterial({
        color: 0x17191a,
        metalness: 0.5,
        roughness: 0.65,
      }),
    );
    stage.position.y = -0.015;
    scene.add(stage);
    for (const radius of [0.29, 0.36]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.0008, 8, 128),
        new THREE.MeshBasicMaterial({
          color: 0x484747,
          transparent: true,
          opacity: 0.5,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.012;
      scene.add(ring);
    }
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 24, 16),
      new THREE.MeshBasicMaterial({
        color: 0x00d5ed,
        toneMapped: false,
        transparent: true,
        opacity: 0.8,
      }),
    );
    scene.add(marker);
    marker.visible = false;
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.028, 0.0015, 8, 64),
      new THREE.MeshBasicMaterial({
        color: 0x00d5ed,
        toneMapped: false,
        transparent: true,
        opacity: 0.8,
      }),
    );
    scene.add(halo);
    halo.visible = false;
    const scan = new THREE.Mesh(new THREE.TorusGeometry(.25, .001, 6, 100), new THREE.MeshBasicMaterial({ color: 0x6fc3dd, transparent: true, opacity: .24 }));
    scan.rotation.x = Math.PI / 2; scan.visible = hero; scene.add(scan);
    const hand = createTouchHand(scene);
    const gripGroup = new THREE.Group();
    gripGroup.matrixAutoUpdate = false;
    gripGroup.visible = false;
    scene.add(gripGroup);
    const gripClips = new Map();
    hand.userData.ready.catch(() => {
      hand.userData.failed = true;
      if (!disposed && ["touch", "massage"].includes(props.current.mode))
        setStatus("error");
    });
    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      const maxDpr = Math.min(devicePixelRatio || 1, 1.5);
      const pixelDpr = Math.sqrt(2000000 / Math.max(1, width * height));
      renderer.setPixelRatio(Math.max(1, Math.min(maxDpr, pixelDpr)));
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    let desired = null,
      desiredTarget = null,
      lastView = "",
      lastKey = "",
      lastMode = "",
      lastDraw = 0,
      touchTime = 0,
      lastLabel = "",
      contacts = {};
    api.current = {
      zoom: (n) => {
        camera.position
          .sub(controls.target)
          .multiplyScalar(n)
          .clampLength(controls.minDistance, 2.8)
          .add(controls.target);
      },
      reset: () => {
        lastView = "";
      },
    };
    const ray = new THREE.Raycaster(),
      pointer = new THREE.Vector2();
    let down = null;
    const onDown = (e) => {
      down = [e.clientX, e.clientY];
    };
    const onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6)
        return;
      const r = el.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray
        .intersectObjects(meshes)
        .find((h) => h.object.userData.group);
      if (hit) {
        props.current.onSelect(
          hit.object.userData.group,
          hit.object.userData.side,
        );
      }
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);
    controls.addEventListener("start", () => {
      desired = null;
      desiredTarget = null;
    });
    Promise.all([
      loadJsonAsset("legsMeta", "/models/legs.json", { signal: abort.signal }),
      loadBufferAsset("legsBuffer", "/models/legs.bin", { signal: abort.signal }),
    ])
      .then(([data, buf]) => {
        if (disposed) return;
        for (const p of data.parts) {
          const g = new THREE.BufferGeometry();
          const pos = new Float32Array(
            buf,
            p.positions,
            p.vertexCount * 3,
          ).slice();
          g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
          g.setAttribute(
            "normal",
            new THREE.BufferAttribute(
              new Int16Array(buf, p.normals, p.vertexCount * 3),
              3,
              true,
            ),
          );
          g.setIndex(
            new THREE.BufferAttribute(
              new Uint32Array(buf, p.indices, p.indexCount),
              1,
            ),
          );
          const m = new THREE.MeshStandardMaterial({
            color: p.system === "skeletal" ? 0x929594 : 0x62686a,
            metalness: 0.42,
            roughness: 0.45,
          });
          const mesh = new THREE.Mesh(g, m);
          const group = muscles.find((x) => x.match.test(p.name))?.id;
          mesh.userData = {
            name: p.name,
            group,
            side: /left/i.test(p.name) ? "left" : "right",
            system: p.system,
            original: pos.slice(),
          };
          meshes.push(mesh);
          scene.add(mesh);
        }
        setStatus(
          hand.userData.failed &&
            ["touch", "massage"].includes(props.current.mode)
            ? "error"
            : "ready",
        );
        lastView = "";
        contacts = {};
      })
      .catch((e) => {
        if (!disposed && e.name !== "AbortError") setStatus("error");
      });
    function contactFor(p, selectedSide) {
      const cacheKey = p.selected + selectedSide;
      if (contacts[cacheKey]) return contacts[cacheKey];
      const result = massageAnchor(meshes, p.selected, selectedSide);
      if (meshes.length) contacts[cacheKey] = result;
      return result;
    }
    const massagePaths = new Map();
    const animationClock = createAnimationClock();
    function massageContact(p, progress) {
      const key = p.selected + p.side + p.technique;
      if (!massagePaths.has(key) && meshes.length) {
        const anchor = contactFor(p, p.side),
          travel = MASSAGES[p.selected].travel;
        const chosen = massageMeshes(meshes, p.selected, p.side);
        const { samples, normals } = sampleMassagePath(anchor, chosen, p.technique, travel, p.side);
        const points = samples.map((point) =>
          point.clone().addScaledVector(anchor.normal, 0.007),
        );
        const trail = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineDashedMaterial({
            color: 0x00d5ed,
        toneMapped: false,
            dashSize: 0.005,
            gapSize: 0.003,
            transparent: true,
            opacity: 0.7,
          }),
        );
        trail.computeLineDistances();
        scene.add(trail);
        const arrow = new THREE.Mesh(
          new THREE.ConeGeometry(0.005, 0.016, 12),
          new THREE.MeshBasicMaterial({ color: 0x00d5ed, toneMapped: false }),
        );
        arrow.position.copy(points[40]);
        arrow.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          points[40].clone().sub(points[36]).normalize(),
        );
        scene.add(arrow);
        massagePaths.set(key, { samples, normals, normal: anchor.normal, trail, arrow });
      }
      massagePaths.forEach((path, pathKey) => {
        path.trail.visible = path.arrow.visible = pathKey === key && !["knead", "thumb"].includes(p.technique);
      });
      const path = massagePaths.get(key);
      if (!path) return contactFor(p, p.side);
      const index = THREE.MathUtils.clamp(
          progress * 40,
          0,
          40,
        ),
        low = Math.floor(index);
      return {
        point: path.samples[low]
          .clone()
          .lerp(path.samples[Math.min(40, low + 1)], index - low),
        normal: path.normals[low].clone().lerp(path.normals[Math.min(40, low + 1)], index - low).normalize(),
      };
    }
    function animate(now) {
      frame = requestAnimationFrame(animate);
      if (document.hidden || now - lastDraw < 30) return;
      const dt = Math.min((now - lastDraw) / 1000, 0.06);
      lastDraw = now;
      const p = props.current;
      const isMassage = p.mode === "massage";
      const isGrip = isMassage && p.selected === "calves" && ["knead", "thumb"].includes(p.technique);
      const isTouch = p.mode === "touch" || isMassage;
      const sceneKey =
        p.mode + p.animationKey + p.touchStep + p.selected + p.side + p.technique;
      if (sceneKey !== lastMode) {
        touchTime = 0;
        lastMode = sceneKey;
      }
      if (isMassage && Number.isFinite(p.elapsedMs)) touchTime = animationClock(p.elapsedMs, p.touchPlaying, now);
      else if (isTouch && p.touchPlaying) touchTime += dt;
      const touch = isMassage
        ? massagePhase(touchTime, p.selected, p.side, p.technique)
        : touchPhase(touchTime, p.touchStep, p.side);
      const focusKey = p.view + p.side + p.selected + p.mode + p.touchStep + isGrip + p.technique;
      if (focusKey !== lastView) {
        controls.minDistance = isTouch ? 0.35 : 1.15;
        if (isTouch) {
          const anchor = contactFor(p, p.side);
          desiredTarget = anchor.point.clone();
          desiredTarget.y += isGrip ? 0 : isMassage ? (TECHNIQUES[p.technique]?.area === "pads" ? -.065 : -.005) : -.045;
          if (p.touchStep === 2 && !isMassage) desiredTarget.x = 0;
          const distance = THREE.MathUtils.clamp(
            (Math.max(anchor.size.y, 0.3) /
              (2 * Math.tan(THREE.MathUtils.degToRad(33) / 2))) *
              1.35,
            0.75,
            1.25,
          );
          const direction =
            p.view === "side"
              ? ["outerthigh", "outercalf"].includes(p.selected)
                ? anchor.normal.clone().add(new THREE.Vector3(0, .12, .2))
                : new THREE.Vector3(p.side === "right" ? -1 : 1, 0.12, 0.1)
              : p.view === "back"
                ? new THREE.Vector3(isGrip ? 0 : .15, isGrip ? .2 : .05, -1)
                : p.selected === "adductors"
                  ? anchor.normal.clone().add(new THREE.Vector3(0, 0.08, 0.2))
                  : new THREE.Vector3(
                      p.side === "right" ? -0.12 : 0.12,
                      0.05,
                      1,
                    );
          desired = desiredTarget
            .clone()
            .add(
              direction
                .normalize()
                .multiplyScalar(isGrip ? .50 : isMassage ? .62 : distance),
            );
        } else if (p.mode === "hero") {
          desiredTarget = new THREE.Vector3(0, 0.49, 0);
          desired = new THREE.Vector3(0.18, 0.54, 1.48);
        } else {
          desiredTarget = new THREE.Vector3(0, 0.52, 0);
          desired = new THREE.Vector3(
            p.view === "back"
              ? -0.28
              : p.view === "side"
                ? p.side === "right"
                  ? -2.05
                  : 2.05
                : 0.4,
            0.65,
            p.view === "back" ? -2.05 : p.view === "side" ? 0.1 : 2.05,
          );
        }
        lastView = focusKey;
      }
      if (desiredTarget) {
        controls.target.lerp(desiredTarget, 0.09);
        if (controls.target.distanceTo(desiredTarget) < 0.002)
          desiredTarget = null;
      }
      if (desired) {
        camera.position.lerp(desired, 0.085);
        if (camera.position.distanceTo(desired) < 0.003) desired = null;
      }
      const k = p.selected + p.side + p.xray + p.mode + p.touchStep;
      if (k !== lastKey || meshes.some((m) => !m.userData.colored)) {
        for (const mesh of meshes) {
          const d = mesh.userData;
          const sel =
            d.group === p.selected && (!isTouch || !muscles.find(r => r.id === p.selected).massageMatch || muscles.find(r => r.id === p.selected).massageMatch.test(d.name)) &&
            (d.side === p.side || (isTouch && p.touchStep === 2 && !isMassage));
          mesh.material.color.set(
            sel ? 0xff7a37 : p.mode === "hero" ? 0x8ca3ac : d.system === "skeletal" ? 0x9c9d96 : 0x70797c,
          );
          mesh.material.emissive.set(sel ? 0x862800 : 0x000000);
          mesh.material.emissiveIntensity = 0.22;
          const faded = isTouch && !sel;
          mesh.material.transparent =
            faded || (p.xray && d.system === "muscular" && !sel);
          mesh.material.opacity = faded
            ? d.side !== p.side && p.touchStep !== 2
              ? 0.08
              : d.system === "skeletal"
                ? 0.12
                : 0.28
            : mesh.material.transparent
              ? 0.2
              : 1;
          mesh.material.depthWrite = !mesh.material.transparent;
          d.colored = true;
        }
        lastKey = k;
      }
      hand.visible = isTouch && !isGrip && meshes.length > 0;
      gripGroup.visible = false;
      marker.visible = halo.visible = hand.visible;
      if (hand.visible) {
        const anchor = isMassage
          ? massageContact(p, touch.progress)
          : contactFor(p, touch.side);
        hand.position
          .copy(anchor.point)
          .addScaledVector(anchor.normal, 0.005 + 0.075 * touch.hover);
        hand.position.y -= 0.04 * touch.hover;
        const alongLeg = new THREE.Vector3(0, 1, 0).addScaledVector(anchor.normal, -anchor.normal.y).normalize();
        const acrossLeg = new THREE.Vector3().crossVectors(alongLeg, anchor.normal).normalize();
        hand.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(acrossLeg, alongLeg, anchor.normal));
        hand.scale.set(touch.side === "left" ? -1 : 1, 1, 1);
        hand.userData.setCurl?.(isMassage ? touch.curl : 0);
        if (isMassage && TECHNIQUES[p.technique]?.area !== "pads") {
          const grip = ["knead", "thumb"].includes(p.technique);
          hand.rotateZ((grip ? Math.PI / 2 : 0) + (touch.roll || 0));
          const localContact = new THREE.Vector3(p.technique === "thumb" ? -0.035 : 0, -0.083, 0.017);
          localContact.x *= touch.side === "left" ? -1 : 1;
          hand.position.sub(localContact.applyQuaternion(hand.quaternion));
          // Leave room for the curved fingers to wrap around the surface instead
          // of disappearing into the muscle along its long axis.
          if (grip) hand.position.addScaledVector(anchor.normal, 0.018);
        }
        marker.position
          .copy(anchor.point)
          .addScaledVector(anchor.normal, 0.003);
        marker.scale.setScalar(touch.contact ? 0.55 : 0.35);
        halo.position.copy(marker.position);
        halo.quaternion.copy(hand.quaternion);
        halo.scale.setScalar(
          touch.contact ? 1 + Math.sin(touchTime * 4) * 0.06 : 1,
        );
        halo.material.opacity = touch.contact ? 0.8 : 0.25;
        const label =
          (touch.side === "left" ? "左腿" : "右腿") + " · " + touch.phase;
        if (label !== lastLabel) {
          lastLabel = label;
          setTouchLabel(label);
        }
      }
      if (isGrip && meshes.length) {
        const key = p.side + ':' + p.technique;
        if (!gripClips.has(key)) {
          const selectedMeshes = meshes.filter(m => m.userData.group === "calves" && m.userData.side === p.side);
          const surface = createCalfSurface(selectedMeshes, contactFor(p, p.side), p.side);
          const clip = createSchematicMassageHand(surface, p.technique);
          gripGroup.add(clip.mesh);gripClips.set(key, clip);
        }
        const clip = gripClips.get(key);
        gripClips.forEach((value, id) => { value.mesh.visible = id === key; });
        clip.update(touchTime);gripGroup.matrix.copy(clip.surface.matrix);gripGroup.visible = true;
        marker.visible = halo.visible = false;
        const label = (p.side === "left" ? "左腿" : "右腿") + " · " + touch.phase;
        if (label !== lastLabel) { lastLabel = label;setTouchLabel(label); }
      }
      if (hero) scan.position.y = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? .45 : .43 + Math.sin(now * .00035) * .27;
      controls.update();
      renderer.render(scene, camera);
    }

    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      hand.userData.disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      scene.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) o.material.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, [retry]);
  return (
    <div className="scene-wrap">
      <div className="scene-canvas" ref={host} />
      {(mode === "touch" || mode === "massage") && (
        <div className="touch-animation-caption">
          <strong>{touchLabel}</strong>
          <span>
            {mode === "massage" ? (TECHNIQUES[technique]?.name || "轻抚示意") : "手势示意 · 轻触表面"}
          </span>
          {!hidePlaybackControl && (
            <button
              onClick={onPlaybackToggle || (() => setTouchPlaying((v) => !v))}
              aria-label={
                (playback ?? touchPlaying)
                  ? mode === "massage"
                    ? "暂停按摩示范"
                    : "暂停轻触示范"
                  : mode === "massage"
                    ? "播放按摩示范"
                    : "播放轻触示范"
              }
            >
              {(playback ?? touchPlaying) ? (
                <Pause size={15} />
              ) : (
                <Play size={15} />
              )}
            </button>
          )}
        </div>
      )}
      {status === "loading" && (
        <div className="scene-status">
          <span className="loader" />
          正在准备你的 3D 肌肉地图…
        </div>
      )}
      {status === "error" && (
        <div className="scene-status">
          <WarningCircle size={28} />
          <p>
            {mode === "massage"
              ? "3D 暂时无法显示，仍可查看下方的详细做法。"
              : "3D 暂时无法显示，你仍可通过部位按钮与文字步骤继续。"}
          </p>
          <button onClick={() => setRetry((r) => r + 1)}>重新加载模型</button>
        </div>
      )}
      <div className="view-switch" aria-label="模型视角">
        {[
          ["front", "正面"],
          ["back", "背面"],
          ["side", "侧面"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={view === id}
            className={view === id ? "active" : ""}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="scene-tools">
        <button aria-label="放大模型" onClick={() => api.current?.zoom(0.88)}>
          <Plus />
        </button>
        <button aria-label="缩小模型" onClick={() => api.current?.zoom(1.12)}>
          <Minus />
        </button>
        <button aria-label="重置模型视角" onClick={() => api.current?.reset()}>
          <ArrowsClockwise />
        </button>
      </div>
      <div className="model-caption">
        <span className="orange-dot" />
        {side === "right" ? "右腿" : "左腿"} ·{" "}
        {muscles.find((m) => m.id === selected).anatomy}
        <small>拖动旋转 · 双指缩放 · 点击肌肉</small>
      </div>
    </div>
  );
}
