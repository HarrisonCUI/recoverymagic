import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assess, muscles } from "../src/data.js";
const gentle = { flags: [], pain: 3, symptom: "紧绷", onset: "第二天开始明显" };
assert.equal(assess(gentle).allow, true);
for (const flag of ["breath", "urine", "swelling", "injury", "weight"])
  assert.equal(
    assess({ ...gentle, flags: [flag] }).allow,
    false,
    `block ${flag}`,
  );
assert.equal(
  assess({ ...gentle, flags: ["breath", "injury"] }).kind,
  "emergency",
);
assert.equal(assess({ ...gentle, pain: 6 }).allow, false);
for (const symptom of ["刺痛", "麻木"])
  assert.equal(assess({ ...gentle, symptom }).allow, false);
assert.equal(assess({ ...gentle, onset: "运动时突然出现" }).allow, false);
const { parts } = JSON.parse(
  readFileSync(new URL("../public/models/legs.json", import.meta.url)),
);
const bytes = readFileSync(
  new URL("../public/models/legs.bin", import.meta.url),
);
for (const p of parts) {
  for (const [key, size] of [
    ["positions", p.vertexCount * 12],
    ["normals", p.vertexCount * 6],
    ["indices", p.indexCount * 4],
  ])
    assert.ok(
      p[key] >= 0 && p[key] + size <= bytes.length,
      `${p.id} ${key} bounds`,
    );
  for (let i = 0; i < p.indexCount; i++)
    assert.ok(
      bytes.readUInt32LE(p.indices + i * 4) < p.vertexCount,
      `${p.id} vertex index`,
    );
  for (let i = 0; i < p.vertexCount * 3; i++)
    assert.ok(
      Number.isFinite(bytes.readFloatLE(p.positions + i * 4)),
      `${p.id} coordinate`,
    );
}
for (const m of muscles)
  for (const side of ["left", "right"])
    assert.ok(
      parts.some(
        (p) => m.match.test(p.name) && p.name.toLowerCase().includes(side),
      ),
      `${m.id} ${side}`,
    );
console.log(
  `PASS: safety-routing cases, ${parts.length} geometry buffers, all ${muscles.length * 2} region/side groups`,
);

// Multi-screen flow contracts: a resumed draft must not bypass safety or duplicate a note.
const {
  initialDraft,
  canEnter,
  validateDraft,
  nextScreen,
  previousScreen,
  makeRecord,
  upsertRecord,
} = await import("../src/flow.js");
const draft = initialDraft({ selected: "calves", side: "left" });
assert.equal(canEnter("recovery", draft), false);
assert.equal(nextScreen({ ...draft, screen: "safety" }), "touch");
assert.equal(nextScreen({ ...draft, screen: "location" }), "touch");
assert.equal(canEnter("touch", draft), true);
assert.equal(previousScreen({ ...draft, screen: "touch" }), "location");
assert.equal(
  nextScreen({ ...draft, screen: "location", flags: ["swelling"] }),
  "care",
);
assert.equal(canEnter("touch", { ...draft, flags: ["swelling"] }), false);
const safe = { ...draft, screen: "touch", safeNone: true };
assert.equal(validateDraft(safe).side, "left");
assert.equal(nextScreen({ ...safe, touchStep: 1 }), null);
assert.equal(nextScreen({ ...safe, touchStep: 2 }), null);
assert.equal(previousScreen({ ...safe, screen: "feeling" }), "touch");
const answered = {
  ...safe,
  screen: "result",
  symptom: "紧绷",
  onset: "第二天开始明显",
};
assert.equal(canEnter("recovery", answered), true);
assert.equal(canEnter("recovery", { ...answered, flags: ["swelling"] }), false);
assert.equal(canEnter("recovery", { ...answered, symptom: "麻木" }), false);
assert.equal(
  validateDraft({ ...answered, screen: "recovery", flags: ["breath"] }),
  null,
);
assert.equal(validateDraft({ ...answered, remaining: Infinity }), null);
const note = makeRecord({ ...answered, remaining: 42500, after: 2 });
assert.equal(note.seconds, 18);
assert.equal(note.after, 2);
assert.equal(upsertRecord([note], { ...note, after: 1 }).length, 1);
assert.equal(upsertRecord([note], { ...note, after: 1 })[0].after, 1);
assert.equal(
  makeRecord({ ...answered, remaining: 45000 }, { stopOnly: true }).seconds,
  15,
);
console.log(
  "PASS: multi-screen navigation, safe resume, real activity time and idempotent record save",
);

// Legacy multi-stage tutorials now resume the single action screen.
const legacyTutorial = { ...answered, screen: "recovery" };
delete legacyTutorial.recoveryStep;
assert.equal(validateDraft(legacyTutorial).recoveryStep, 1);
assert.equal(
  validateDraft({ ...legacyTutorial, recoveryStep: 1 }).recoveryStep,
  1,
);
assert.equal(
  validateDraft({ ...legacyTutorial, recoveryStep: Infinity }).recoveryStep,
  1,
);
assert.equal(nextScreen({ ...legacyTutorial, recoveryStep: 1 }), "feedback");
assert.equal(nextScreen({ ...legacyTutorial, recoveryStep: 2 }), "feedback");
console.log("PASS: tutorial stage migration, resume and feedback gating");
assert.equal(assess({ ...gentle, stopped: true }).allow, false);
assert.equal(canEnter("recovery", { ...answered, stopped: true }), false);
const stoppedNote = makeRecord(
  { ...answered, stopped: true },
  { stopOnly: true },
);
assert.equal(stoppedNote.symptom, "紧绷");
assert.equal(stoppedNote.stopped, true);
console.log(
  "PASS: stopping blocks further exercise and preserves reported symptoms",
);

// No checkbox required; an unreported signal is not stored as a negative finding.
const unblocked = { ...answered, safeNone: false };
assert.equal(canEnter("recovery", unblocked), true);
assert.equal(validateDraft({ ...unblocked, screen: "touch" }).safeNone, false);
assert.equal(canEnter("recovery", { ...unblocked, flags: ["breath"] }), false);
assert.equal(canEnter("result", { ...draft, flags: ["breath"] }), true);
console.log(
  "PASS: reminder-only flow, legacy safety entry and explicit signal routing",
);

// Every non-exercise outcome has a useful, resumable care route.
const { carePlanFor } = await import("../src/care.js");
const careCases = [
  { ...answered, onset: "运动时突然出现" },
  { ...answered, stopped: true },
  ...["breath", "urine", "swelling", "weight", "injury"].map((flag) => ({
    ...answered,
    flags: [flag],
  })),
  { ...answered, pain: 7, onset: "运动时突然出现" },
  { ...answered, symptom: "麻木", onset: "运动时突然出现" },
];
for (const d of careCases) {
  assert.equal(nextScreen({ ...d, screen: "result" }), "care");
  assert.equal(canEnter("care", d), true);
  assert.equal(canEnter("recovery", d), false);
  const restored = validateDraft({ ...d, screen: "care", careStep: 1 });
  assert.equal(restored.careStep, 1);
  assert.equal(carePlanFor(d).steps.length, 3);
  assert.equal(nextScreen({ ...d, screen: "care", careStep: 2 }), "complete");
}
assert.equal(
  carePlanFor({ ...answered, pain: 7, onset: "运动时突然出现" }).id,
  "assessment",
);
assert.equal(
  carePlanFor({ ...answered, flags: ["breath", "injury"] }).emergency,
  true,
);
assert.equal(carePlanFor(answered), null);
assert.equal(canEnter("care", answered), false);
const careRecord = makeRecord(
  { ...careCases[0], screen: "care", careStep: 2, careNote: "test note" },
  { stopOnly: true },
);
assert.equal(careRecord.carePlan, "injury");
assert.equal(careRecord.careNote, "test note");
assert.equal(careRecord.after, null);
assert.equal(careRecord.seconds, 0);
console.log(
  "PASS: actionable care paths, urgency precedence, resume and honest plan records",
);

const { cleanPreferences, rememberChoice, frequentRegions } =
  await import("../src/preferences.js");
let prefs = rememberChoice(cleanPreferences(null), {
  ...answered,
  id: "preference-a",
  selected: "calves",
  side: "left",
  sport: "骑行",
});
prefs = rememberChoice(prefs, {
  ...answered,
  id: "preference-a",
  selected: "calves",
  side: "left",
  sport: "骑行",
});
assert.equal(
  prefs.choices[0].count,
  1,
  "back/next does not double count the same selection",
);
prefs = rememberChoice(prefs, {
  ...answered,
  id: "preference-b",
  selected: "calves",
  side: "left",
  sport: "骑行",
});
assert.equal(frequentRegions(prefs)[0].count, 2);
const seeded = initialDraft(prefs.last);
assert.equal(seeded.selected, "calves");
assert.equal(seeded.side, "left");
assert.equal(seeded.sport, "骑行");
assert.equal(seeded.symptom, "");
assert.equal(seeded.onset, "");
assert.deepEqual(seeded.flags, []);
assert.equal("pain" in prefs.last, false);
assert.equal(
  cleanPreferences({
    last: { selected: "bad" },
    choices: [{ count: Infinity }],
    seen: [null],
  }).choices.length,
  0,
);
assert.equal(cleanPreferences(null).last, null);
const { MOTIONS, movementPose } = await import("../src/motions.js");
const { touchPhase } = await import("../src/touchGuide.js");
assert.equal(new Set(Object.values(MOTIONS).map((m) => m.id)).size, 5);
for (const m of muscles) {
  const rest = movementPose(m.id, 0, "right"),
    peak = movementPose(m.id, 3, "right");
  for (let t = 0; t <= 60; t += 0.2) {
    const p = movementPose(m.id, t, "right");
    for (const joint of Object.values(p.joints))
      assert.ok(joint.every(Number.isFinite));
    assert.deepEqual(
      p.joints.leftAnkle,
      rest.joints.leftAnkle,
      "supporting ankle stays steady",
    );
    assert.ok(p.joints.rightAnkle[1] >= 0.084, "ankle stays above floor");
    const mirrored = movementPose(m.id, t, "left");
    for (const part of ["Hip", "Knee", "Ankle"]) {
      const a = p.joints["right" + part],
        b = mirrored.joints["left" + part];
      assert.ok(
        Math.abs(a[0] + b[0]) < 1e-9 &&
          Math.abs(a[1] - b[1]) < 1e-9 &&
          Math.abs(a[2] - b[2]) < 1e-9,
        "left/right mirroring",
      );
    }
    const a = p.joints.rightKnee,
      b = p.joints.rightAnkle;
    assert.ok(
      Math.abs(Math.hypot(...a.map((v, i) => v - b[i])) - 0.365) < 0.002,
      "lower leg retains length",
    );
  }
  assert.notDeepEqual(
    [rest.joints.rightAnkle, rest.feet.right],
    [peak.joints.rightAnkle, peak.feet.right],
    m.id + " has visible motion",
  );
}
assert.equal(touchPhase(2, 1, "right").contact, true);
assert.equal(touchPhase(5, 1, "right").contact, false);
assert.equal(touchPhase(8, 2, "right").side, "left");
assert.equal(touchPhase(8, 0, "right").hover, 1);
console.log(
  "PASS: local preference deduplication, clean new sessions, 5 motions, stable supports, mirrored limbs and touch phases",
);

// The short route still requires fresh symptom/onset input and preserves risk routing.
assert.equal(initialDraft().screen, "location");
assert.equal(nextScreen({ ...answered, screen: "touch" }), "recovery");
assert.equal(
  nextScreen({ ...answered, screen: "touch", symptom: "麻木" }),
  "care",
);
assert.equal(nextScreen({ ...answered, screen: "touch", onset: "" }), null);
assert.equal(
  validateDraft({ ...answered, screen: "activity" }).screen,
  "location",
);
assert.equal(validateDraft({ ...answered, screen: "feeling" }).screen, "touch");
assert.equal(
  validateDraft({ ...answered, screen: "result" }).screen,
  "recovery",
);
assert.equal(
  validateDraft({ ...answered, screen: "result", flags: ["breath"] }).screen,
  "care",
);
assert.equal(makeRecord(answered, { stopOnly: true }).after, null);
console.log(
  "PASS: three-screen flow, legacy route migration, optional feedback",
);

// Verify real Atlas source buffers and skinning: finite normalized weights, all
// original leg meshes retained, and a visibly moving selected limb in each pose.
const THREE = await import("three");
const { atlasWeights, atlasSkinArmMask, createAtlasRig } = await import("../src/AtlasRig.js");
const movementMeta = JSON.parse(
  readFileSync(new URL("../public/models/movement.json", import.meta.url)),
);
const movementBytes = readFileSync(
  new URL("../public/models/movement.bin", import.meta.url),
);
assert.ok(movementMeta.parts.some((p) => p.name === "Skin"));
for (const part of parts)
  assert.ok(
    movementMeta.parts.some((p) => p.name === part.name),
    part.name,
  );
for (const p of movementMeta.parts) {
  for (const [key, size] of [
    ["positions", p.vertexCount * 12],
    ["normals", p.vertexCount * 6],
    ["indices", p.indexCount * 4],
  ])
    assert.ok(p[key] + size <= movementBytes.length);
  for (let i = 0; i < p.vertexCount; i++) {
    const x = movementBytes.readFloatLE(p.positions + i * 12),
      y = movementBytes.readFloatLE(p.positions + i * 12 + 4);
    const [ids, weights] = atlasWeights(x, y, p.name === "Skin");
    assert.ok(ids.every((id) => id >= 0 && id < 13));
    assert.ok(weights.every((w) => Number.isFinite(w) && w >= 0 && w <= 1));
    assert.ok(Math.abs(weights[0] + weights[1] - 1) < 1e-6);
  }
}
const savedFetch = globalThis.fetch;
globalThis.fetch = async (url) => ({
  ok: true,
  json: async () => movementMeta,
  arrayBuffer: async () =>
    movementBytes.buffer.slice(
      movementBytes.byteOffset,
      movementBytes.byteOffset + movementBytes.byteLength,
    ),
});
for (const m of muscles) {
  const scene = new THREE.Scene(),
    rig = await createAtlasRig(scene, m.id, "right");
  const meshes = scene.children.filter((o) => o.isSkinnedMesh);
  assert.equal(meshes.length, 5, "anatomy, body skin and independent shorts");
  const bodySkin = meshes.find((o) => o.name === "Atlas continuous body skin");
  assert.ok(bodySkin.geometry.index.count < movementMeta.parts.find((p) => p.name === "Skin").indexCount, "covered anatomy is not drawn under shorts");
  const shorts = meshes.find((o) => o.name === "Atlas opaque sports shorts");
  assert.ok(shorts.visible && !shorts.material.transparent && shorts.material.opacity === 1, "shorts must be opaque and visible");
  assert.equal(shorts.skeleton, bodySkin.skeleton, "garment follows the same pose");
  for (const x of [-0.18, 0.18]) {
    assert.ok(atlasWeights(x, 0.65, true)[0].every((id) => id < 7), "outer thighs must never follow arm bones");
  }
  const active = meshes.find((o) => o.material.color.getHex() === 0xff793e);
  function sample(t) {
    rig.update(t);
    scene.updateMatrixWorld(true);
    active.skeleton.update();
    return meshes.filter((mesh) => mesh.visible).flatMap((mesh) =>
      Array.from({ length: 128 }, (_, i) =>
        mesh
          .getVertexPosition(
            Math.floor((i * mesh.geometry.attributes.position.count) / 128),
            new THREE.Vector3(),
          )
          .toArray(),
      ),
    );
  }
  const a = sample(0),
    b = sample(2);
  assert.ok(b.flat().every(Number.isFinite));
  assert.ok(
    a.some(
      (v, i) =>
        new THREE.Vector3(...v).distanceTo(new THREE.Vector3(...b[i])) > 0.005,
    ),
    m.id + " limb visibly moves",
  );
  rig.dispose();
  meshes.forEach((o) => {
    o.geometry.dispose();
    o.material.dispose();
  });
}
// The supine pose must retain opaque clothing throughout either leg's cycle.
const { supineMassagePose: clothedSupinePose } = await import('../src/massagePose.js');
for (const side of ['left', 'right']) {
  const scene = new THREE.Scene();
  const rig = await createAtlasRig(scene, 'hamstrings', side, () => false, clothedSupinePose);
  const shorts = scene.children.find((o) => o.name === 'Atlas opaque sports shorts');
  for (const phase of [0, 1.5, 3, 4.5, 6]) {
    rig.update(phase);
    scene.updateMatrixWorld(true);
    shorts.skeleton.update();
    const body=scene.children.find(o=>o.name==='Atlas continuous body skin');
    const joints=clothedSupinePose('hamstrings',phase,side).joints;
    const thighAxis=new THREE.Line3(new THREE.Vector3(...joints[side+'Hip']),new THREE.Vector3(...joints[side+'Knee']));
    const handPoints=[[],[]];
    for(let i=0;i<body.geometry.attributes.position.count;i++) {
      if(body.geometry.attributes.skinIndex.getY(i)<11||body.geometry.attributes.skinWeight.getY(i)<.8)continue;
      const point=body.getVertexPosition(i,new THREE.Vector3());
      handPoints[body.geometry.attributes.skinIndex.getY(i)-11].push(point);
      const closest=thighAxis.closestPointToPoint(point,true,new THREE.Vector3());
      assert.ok(point.distanceTo(closest)>.07,'palm and fingers stay outside the inner thigh clearance capsule');
    }
    for(const a of handPoints[0])for(const b of handPoints[1]) {
      assert.ok(a.distanceToSquared(b)>.008**2,'left and right finger surfaces remain separated');
    }
    for (let i = 0; i < shorts.geometry.attributes.position.count; i++) {
      const point = shorts.getVertexPosition(i, new THREE.Vector3());
      assert.ok(point.toArray().every(Number.isFinite), 'shorts remain valid in mirrored supine motion');
    }
  }
  rig.dispose();
  scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
}
globalThis.fetch = savedFetch;
console.log(
  "PASS: Atlas source identity, geometry bounds, normalized skinning, rendered mesh deformation",
);

// A massage demonstration must move across the surface during contact, then lift.
const { MASSAGES, massagePhase } = await import("../src/massage.js");
for (const region of muscles) {
  assert.ok(MASSAGES[region.id].setup && MASSAGES[region.id].cue);
  const start = massagePhase(1.5, region.id, "right"),
    end = massagePhase(5.99, region.id, "right");
  assert.ok(
    end.offset - start.offset > 0.02,
    region.id + " has a visible stroke",
  );
  for (let t = 0; t < 16; t += 0.1) {
    const p = massagePhase(t, region.id, "right");
    assert.ok(
      Number.isFinite(p.offset) &&
        Math.abs(p.offset) <= MASSAGES[region.id].travel / 2 + 0.0001,
    );
    assert.ok(p.hover >= 0 && p.hover <= 1);
    if (p.contact)
      assert.equal(p.hover, 0, "contact stays on the projected muscle surface");
    assert.equal(
      massagePhase(t, region.id, "left").offset,
      p.offset,
      "same gesture on both sides",
    );
  }
  assert.equal(massagePhase(7, region.id).contact, false);
  assert.ok(massagePhase(7, region.id).hover > 0);
}
console.log(
  "PASS: five massage gestures, bounded travel, contact/lift sequencing and mirrored pacing",
);
const { publicRoute } = await import("../src/recoveryRoutes.js");
for (const m of muscles)
  assert.deepEqual(publicRoute("#/tutorial/" + m.id), {
    magicPage: "tutorial",
    lessonRegion: m.id,
  });
assert.deepEqual(publicRoute("#/tutorial/invalid"), { magicPage: "home" });
assert.deepEqual(publicRoute("#/library"), { magicPage: "library" });
assert.equal(initialDraft().recoveryMethod, "massage");
const legacyMethod = { ...answered, screen: "recovery" };
delete legacyMethod.recoveryMethod;
delete legacyMethod.recoveryAction; // Pre-action-picker drafts did not have a named action.
assert.equal(validateDraft(legacyMethod).recoveryMethod, "movement");
assert.equal(
  validateDraft({ ...answered, screen: "recovery", recoveryMethod: "massage" })
    .recoveryMethod,
  "massage",
);
console.log(
  "PASS: direct tutorial routes and persisted recovery method migration",
);

// Distinct massage techniques must actually produce different gestures.
const { TECHNIQUES, techniqueFor } = await import('../src/massage.js');
for (const region of muscles) {
  for (const id of MASSAGES[region.id].techniques) {
    assert.equal(techniqueFor(region.id, id), TECHNIQUES[id]);
    assert.ok(TECHNIQUES[id].contact && TECHNIQUES[id].unit && TECHNIQUES[id].pressure);
    for (const side of ['left', 'right']) {
      for (let t = 0; t < 16; t += 0.25) {
        const p = massagePhase(t, region.id, side, id);
        assert.ok([p.offset, p.lateral, p.curl, p.roll, p.progress].every(Number.isFinite));
        assert.ok(p.curl >= 0 && p.curl <= 1);
        assert.ok(p.progress >= 0 && p.progress <= 1);
      }
    }
  }
}
assert.ok(Math.abs(massagePhase(3.75, 'quads', 'right', 'circle').lateral) > 0.01);
assert.ok(massagePhase(3.75, 'calves', 'right', 'knead').curl > massagePhase(0, 'calves', 'right', 'knead').curl + 0.5);
assert.equal(massagePhase(3.75, 'calves', 'right', 'thumb').offset, 0);
assert.equal(massagePhase(7, 'calves', 'right', 'knead').contact, false);
const { supineMassagePose } = await import('../src/massagePose.js');
for (const side of ['left', 'right']) {
  const rest = supineMassagePose('hamstrings', 0, side), bent = supineMassagePose('hamstrings', 3, side);
  assert.deepEqual(rest.joints.pelvis, bent.joints.pelvis, 'supported pelvis remains stable');
  assert.deepEqual(rest.joints[side + 'Knee'], bent.joints[side + 'Knee'], 'hands support a stable thigh');
  const length = (p) => new THREE.Vector3(...p.joints[side + 'Ankle']).distanceTo(new THREE.Vector3(...p.joints[side + 'Knee']));
  assert.ok(Math.abs(length(rest) - length(bent)) < 1e-6, 'supine shin does not stretch');
  assert.notDeepEqual(rest.joints[side + 'Ankle'], bent.joints[side + 'Ankle']);
}
console.log('PASS: distinct circle, sweep, knead, thumb gestures and stable mirrored supine knee motion');

// A non-practice outcome still has a tutorial path. Learning must not clear risk
// answers, authorize practice, increment activity, or masquerade as feedback.
const { tutorialCareContext } = await import('../src/recoveryRoutes.js');
for (const risk of [
  { onset: '运动时突然出现' },
  { symptom: '麻木' },
  { pain: 7 },
  { stopped: true },
  { flags: ['swelling'] },
  { flags: ['breath'] },
]) {
  const d = { ...initialDraft(), symptom: '酸胀', onset: '运动后逐渐出现', ...risk, screen: 'care' };
  const before = JSON.stringify(d);
  assert.deepEqual(tutorialCareContext(d, d.selected), { draftId: d.id, side: d.side });
  assert.ok(tutorialCareContext(validateDraft(JSON.parse(before)), d.selected), 'learning context survives reload');
  assert.equal(canEnter('recovery', d), false, 'tutorial viewing must not authorize physical practice');
  assert.equal(tutorialCareContext(d, 'calves'), null, 'context belongs to selected region');
  assert.equal(JSON.stringify(d), before, 'tutorial lookup must not mutate the draft');
  const item = makeRecord(d, { stopOnly: true });
  assert.equal(item.after, null);
  assert.equal(item.seconds, 0);
  assert.deepEqual(item.flags, d.flags);
  assert.ok(item.carePlan);
}
assert.equal(tutorialCareContext(initialDraft(), 'quads'), null);
console.log('PASS: every care outcome can open learning context without clearing risk, adding practice time or losing resumable advice');

// Outbound navigation is intentionally absent from all product views. The only
// rendered anchor is the app's home hash; local record export remains a Blob.
const { readdirSync } = await import('node:fs');
const sourceRoot = new URL('../src/', import.meta.url);
for (const name of readdirSync(sourceRoot).filter((name) => name.endsWith('.jsx'))) {
  const code = readFileSync(new URL(name, sourceRoot), 'utf8');
  for (const tag of code.matchAll(/<a\s[\s\S]*?>/g)) {
    assert.match(tag[0], /href="#\/[a-z]*"/, name + ': anchors must stay inside the app');
    assert.doesNotMatch(tag[0], /target=/, name + ': no new browsing surface');
  }
  assert.doesNotMatch(code, /window\.open\s*\(|(?:location\.(?:href|assign|replace))\s*[=(]/, name + ': no outbound navigation handler');
}
const emergencyAdvice = carePlanFor({ ...gentle, flags: ['breath'] });
assert.match(emergencyAdvice.priority, /立即.*120/);
assert.equal(assess({ ...gentle, flags: ['breath'] }).allow, false);
console.log('PASS: product links remain in-app while emergency guidance stays explicit');

// Regression: waist vertices must remain with the torso even where their x/y
// coordinates overlap the arms in projection. Use actual source connectivity.
const skinPart = movementMeta.parts.find((part) => part.name === 'Skin');
const skinPositions = Float32Array.from({ length: skinPart.vertexCount * 3 }, (_, i) => movementBytes.readFloatLE(skinPart.positions + i * 4));
const skinIndices = Uint32Array.from({ length: skinPart.indexCount }, (_, i) => movementBytes.readUInt32LE(skinPart.indices + i * 4));
const armRegions = atlasSkinArmMask(skinPositions, skinIndices);
let waistSamples = 0, armSamples = 0;
for (let i = 0; i < skinPart.vertexCount; i++) {
  const x = skinPositions[i * 3], y = skinPositions[i * 3 + 1];
  const [ids] = atlasWeights(x, y, true, armRegions[i]);
  if (armRegions[i] === 0 && y > 0.97 && y < 1.16) {
    assert.ok(ids.every((id) => id === 0), 'torso surface must not be dragged toward wrist');
    waistSamples++;
  }
  if (Math.abs(armRegions[i]) === 1) {
    assert.ok(ids.every((id) => id >= 7 || (y > 1.16 && id === 0)), 'only the shoulder transition may blend into the torso');
    armSamples++;
  }
}
assert.ok(waistSamples > 100 && armSamples > 1000);
for (const side of ['left', 'right']) {
  for (const t of [0, 1.5, 3, 4.5, 6]) {
    const { joints } = supineMassagePose('hamstrings', t, side);
    for (const arm of ['left', 'right']) {
      const shoulder = new THREE.Vector3(...joints[arm + 'Shoulder']);
      const elbow = new THREE.Vector3(...joints[arm + 'Elbow']);
      const wrist = new THREE.Vector3(...joints[arm + 'Hand']);
      assert.ok(Math.abs(shoulder.distanceTo(elbow) - 0.2835) < 1e-5);
      assert.ok(Math.abs(elbow.distanceTo(wrist) - 0.223) < 1e-5, 'forearm and attached hand must not stretch into thigh');
    }
  }
}
console.log('PASS: connected arm/torso skin assignment and constant-length mirrored support arms');

// Action links carry an explicit valid choice; changing planned time must not fabricate activity.
const { actionsFor, actionFor, recoveryRegions, tutorialHash, sessionDuration, relaxationPhase } = await import('../src/recoveryCatalog.js');
assert.equal(recoveryRegions.length, 7);
assert.equal(recoveryRegions.reduce((n, r) => n + actionsFor(r.id).length, 0), 24);
for (const region of recoveryRegions) {
  for (const action of actionsFor(region.id)) {
    for (const duration of [30000,60000,300000]) {
      const route = publicRoute(tutorialHash(region.id, action.id, duration));
      assert.equal(route.lessonRegion, region.id);
      assert.equal(route.lessonAction, action.id);
      assert.equal(route.lessonDuration, duration);
      const timed = validateDraft({ ...answered, selected: region.id, screen: 'recovery', duration, remaining: duration, practiceMs: 0 });
      assert.ok(timed);
      assert.equal(makeRecord(timed).seconds, 0);
      assert.equal(makeRecord({ ...timed, remaining: 0, practiceMs: 24000 }).seconds, 24);
    }
  }
}
assert.equal(actionFor('shins','knead').id, 'light');
assert.equal(sessionDuration(-1), 60000);
assert.equal(publicRoute('#/tutorial/outercalf?action=pin&duration=900').lessonAction, 'light');
assert.equal(publicRoute('#/tutorial/calves?action=thumb&duration=NaN').lessonDuration, 60000);
assert.equal(publicRoute('#/library/outerthigh').libraryRegion, 'outerthigh');
assert.equal(publicRoute('#/library/unknown').magicPage, 'home');
assert.equal(relaxationPhase(300000, 275000), 'practice');
assert.equal(relaxationPhase(300000, 270000), 'rest');
assert.equal(relaxationPhase(60000, 0), 'complete');
assert.equal(validateDraft({ ...answered, duration: 30000, remaining: 60000 }), null);
assert.equal(tutorialCareContext({ ...careCases[0], screen:'care', selected:'outerthigh' }, 'outerthigh').draftId, answered.id);
console.log('PASS: 24 action routes × 3 durations, new regions, countdown phases, care context and independent activity accounting');

// New lateral guides must hit real soft-tissue surfaces on both sides, with no fallback anchor in empty space.
for (const id of ['outerthigh', 'outercalf']) {
  const region = muscles.find(m => m.id === id);
  for (const side of ['left','right']) {
    const sign = side === 'left' ? 1 : -1;
    const normal = new THREE.Vector3(sign * .8, 0, id === 'outerthigh' ? .6 : .15).normalize();
    const targetMeshes = parts.filter(p => (region.massageMatch || region.match).test(p.name) && p.name.toLowerCase().includes(side)).map(p => {
      const g = new THREE.BufferGeometry();
      const vertices = new Float32Array(p.vertexCount * 3);
      const indices = new Uint32Array(p.indexCount);
      for(let i=0;i<vertices.length;i++) vertices[i]=bytes.readFloatLE(p.positions+i*4);
      for(let i=0;i<indices.length;i++) indices[i]=bytes.readUInt32LE(p.indices+i*4);
      g.setAttribute('position', new THREE.BufferAttribute(vertices,3));
      g.setIndex(new THREE.BufferAttribute(indices,1));
      return new THREE.Mesh(g,new THREE.MeshBasicMaterial());
    });
    for (const offset of [-.0175, 0, .0175]) {
      const point = new THREE.Vector3(sign*Math.abs(region.point[0]),region.point[1]+offset,region.point[2]);
      const ray = new THREE.Raycaster(point.clone().addScaledVector(normal,.6), normal.clone().negate());
      assert.ok(ray.intersectObjects(targetMeshes).length, `${id} ${side} has actual soft-tissue contact at ${offset}`);
    }
    targetMeshes.forEach(m=>{m.geometry.dispose();m.material.dispose();});
  }
}
console.log('PASS: lateral thigh and calf surface contact at start/mid/end on both sides');

// Main self-check and library share every action, and guided choices survive resume/refresh.
const { guidedActionFor, configureGuidedRecovery } = await import('../src/recoveryCatalog.js');
const { appRoute } = await import('../src/recoveryRoutes.js');
for (const region of recoveryRegions) {
  const session = { ...answered, selected: region.id, screen: 'recovery', practiceMs: 12500 };
  for (const action of actionsFor(region.id)) {
    const chosen = configureGuidedRecovery(session, { actionId: action.id, duration: 300000 });
    assert.equal(chosen.recoveryAction, action.id);
    assert.equal(chosen.recoveryMethod, action.method);
    assert.equal(chosen.remaining, 300000);
    assert.equal(chosen.practiceMs, 12500, 'changing plans retains actual practice');
    const restored = validateDraft(JSON.parse(JSON.stringify(chosen)));
    assert.equal(guidedActionFor(restored).id, action.id);
    assert.equal(restored.duration, 300000);
    assert.equal(appRoute('#/recovery', restored).magicPage, 'recovery');
    assert.equal(makeRecord(restored).recoveryActionName, action.name);
    assert.equal(makeRecord(restored).plannedSeconds, 300);
    assert.equal(makeRecord(restored).seconds, 13);
    const shorter = configureGuidedRecovery(restored, { duration: 30000 });
    assert.equal(shorter.recoveryAction, action.id);
    assert.equal(shorter.practiceMs, 12500);
    assert.equal(shorter.remaining, 30000);
  }
}
assert.equal(appRoute('#/recovery', null).magicPage, 'home');
assert.equal(appRoute('#/recovery', initialDraft()).magicPage, 'location');
const oldMovement = { ...answered, screen:'recovery', recoveryMethod:'movement' };
delete oldMovement.recoveryAction;
assert.equal(validateDraft(oldMovement).recoveryAction, 'movement');
const oldMassage = { ...oldMovement, recoveryMethod:'massage' };
assert.equal(validateDraft(oldMassage).recoveryAction, actionsFor(oldMassage.selected)[0].id);
for(const candidate of careCases) {
  const savedCare = { ...candidate, screen:'care' };
  assert.equal(appRoute('#/recovery', savedCare).magicPage, 'care');
  assert.equal(appRoute('#/touch', savedCare).magicPage, 'care');
  assert.equal(makeRecord(savedCare, {stopOnly:true}).recoveryActionName, null);
}
console.log('PASS: all main-flow action choices, duration persistence, honest activity records, legacy migration and guarded refresh');

// Exported notes must preserve missing scores, actual timing and care context.
const { noteSections, scoreText, noteFilename } = await import('../src/noteImage.js');
assert.equal(scoreText(null), '未评分');
assert.equal(scoreText(undefined), '未评分');
assert.equal(scoreText(0), '0 / 10');
const restingDraft = { ...answered, screen: 'care', onset: '运动时突然出现', remaining: 60000, practiceMs: 0, careRestMs: 18420, careNote: '休息后仍有紧绷，今天先不跑步。' };
const restedNote = makeRecord(restingDraft, { stopOnly: true });
assert.equal(restedNote.seconds, 0);
assert.equal(restedNote.careRestSeconds, 18);
assert.equal(restedNote.after, null);
assert.equal(validateDraft(restingDraft).careRestMs, 18420);
assert.equal(validateDraft({ ...restingDraft, careRestMs: -1 }).careRestMs, 0);
const sharedText = JSON.stringify(noteSections(restedNote));
assert.ok(sharedText.includes('18 秒（单独计时）'));
assert.ok(sharedText.includes('本次未记录按摩跟练'));
assert.ok(sharedText.includes(restedNote.careNote));
assert.ok(sharedText.includes('最初几天避免深揉'));
assert.ok(!JSON.stringify(noteSections({ region: '小腿', pain: null, after: undefined })).includes('undefined'));
assert.ok(noteFilename({ region: '小腿/外侧', date: 'invalid' }).endsWith('小腿外侧-记录.png'));
assert.equal(canEnter('recovery', restingDraft), false, 'rest does not clear suspected injury');
console.log('PASS: share-note fields, missing/zero scores, care guidance and independent supported-rest time');
