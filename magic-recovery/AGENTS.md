# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Product decisions — 2026-09-15

- Preserve the accepted dark/silver/orange sports-tech visual language and real Human Atlas / BodyParts3D leg geometry.
- Evolve the working preview into a mini-program-style app: separate screens, focused steps and an end-to-end guided loop rather than an all-in-one dashboard.
- Home, action library and records use bottom navigation. The guided flow hides those tabs and provides back/next, safe exit and resumable drafts.
- Completion includes feedback, a saved body note and a route back into a later self-check. No clinical diagnosis claims.
- This iteration is the mobile-first H5 interaction prototype; it does not imply a native WeChat mini-program package or live platform integration.

- Result pages must visibly lead to a practical relaxation tutorial: setup, step-by-step 3D movement, settling and feedback. A timer and one-line cue are insufficient.
- Region-first language should cover discomfort without claiming a muscle/fascia diagnosis. Tutorials must retain safety routing and allow immediate stopping.

- Ordinary touch precautions are short, nonblocking reminders. Normal flow goes directly from location to touch without mandatory negative-symptom checkboxes or a separate safety screen. Optional abnormal-symptom advice remains available; explicitly reported danger signs still route to appropriate advice and do not offer exercise. Do not store a negative symptom finding just because the user continued.

- No result should end in a dead end. A non-exercise result leads to an actionable care plan, then optional notes, saving, review and later recheck. Cover immediate comfort measures, applicability, monitoring and when to obtain care. Emergency contact stays immediately accessible, with no required tutorial completion. Saving a plan must not imply the user carried it out or obtained a diagnosis.

- Remember frequently confirmed regions, left/right side and last sport locally; new sessions must start with fresh symptoms and risk answers. Expose a clear-preferences control without deleting notes.
- Touch stage should automatically frame the chosen region and teach with an animated 3D hand, including approach/contact/release and left/right comparison. Hand gestures are surface-touch demonstrations, not simulated pressure measurements.
- Recovery needs an actual full-body action picture with visible supports, not merely a deformed isolated leg plus text. Maintain distinct region-appropriate movements and synchronise counted exercise with playback; uncounted demonstrations must be labelled.

## Simplification decisions — 2026-09-15

- Main path is three screens: location → touch + feelings → advice + actual movement. Sport is a remembered optional selector on location; do not reintroduce a sport-only screen, three touch confirmations, a separate result confirmation, or preparation/settling gates.
- Finish feedback is an optional bottom sheet, with an explicit skip that stores `after: null`. Keep actual exercise seconds separate from uncounted demonstrations.
- Use Human Atlas geometry for the exercise person: real upper-body skin plus original leg muscles/bones, adapted with GPU skinning. Keep the silver/orange materials; do not replace this with a procedural mannequin.
- Keep essential controls/content visible at 390×844 and 320×740. Put detailed preparation, contraindications, rationale and care instructions in user-opened sheets; allow scrolling for expanded content and accessibility text sizes.
- Care outcomes remain actionable on one screen, with detailed instructions and optional notes available. Emergency contact stays immediately accessible, including after saving.

## Massage and direct tutorials — 2026-09-15

- Label the bottom action tab “恢复动作”. Every library card directly opens a read-only tutorial; never redirect through a new assessment or replace an unfinished draft just to watch it.
- Tutorials support validated `#/tutorial/:region` links, refresh, back to the library, left/right and massage/joint-activity switching.
- Massage is the default tutorial and new guided-session method. Use the current Human Atlas mesh with a surface-projected animated hand (place → light stroke → lift), a direction trail and playback control. GIF is only a fallback if 3D cannot communicate the gesture.
- Keep ordinary precautions short and nonblocking; instructional access is not a finding that massage is suitable. Do not show deep pressure, painful kneading, or massage of a new injury/red swollen area as routine self-care.
- Preserve the original Atlas joint activity demonstrations as an alternate method. Old movement drafts resume as movement; new drafts start with massage.

- Replace the primitive glove in both touch and massage guidance with the continuous Human Atlas / BodyParts3D hand surface (`public/models/hand.json`). Keep natural fingers, thumb and wrist, a neutral silver material, and surface-aligned mirrored gestures. Do not restore the sphere/capsule fingers or black wrist ball.

## Contact and pressure clarity — 2026-09-15

- Massage tutorials must show the exact contact digits/pads, effort guidance and trial/release sequence in the initial instruction area, consistently in direct tutorials and guided recovery.
- Label the three-finger choice as this demonstration's convention, not a medically prescribed finger count. A palm-side contact diagram identifies index/middle/ring pads; keep the natural Atlas hand intact.
- Teach surface contact without added pain or deep pressure. Do not invent kilogram/Newton values or imply that the 3D hand measures/simulates force. Animation cycles and the session timer are not a recommended clinical dosage.

## Repetitions and purpose — 2026-09-15

- Distinguish self-check touch/comparison from massage relaxation and joint movement. None is a medical diagnosis; the current massage is a light surface stroke rather than kneading.
- Each massage and movement tutorial needs a first-screen sentence explaining its intended comfort goal, plus repetition count, what counts as one repetition and when to reassess.
- Introductory practice is one round of 1–3 repetitions: try one, only add two if comfortable, then stop and assess. This is a lesson structure, not an evidence-validated treatment dose or daily prescription. Keep the existing timer optional and do not infer completed user repetitions from animation loops.
- Explain desired relief of tightness/stiffness without promising injury healing or claiming tissue-specific efficacy from a selected body region.

## Guide-based massage and full-body repair — 2026-09-15

- Use the supplied “坐姿和躺姿徒手腿部放松指南 运动专项扩展版.docx” as the massage content reference. Keep existing risk routing and avoid adding compulsory steps from its longer checklist.
- Offer region-specific techniques: quadriceps circular whole-palm rubbing and longitudinal strokes; calf gentle whole-hand kneading, wide strokes and cautious thumb-pad contact; supine supported hamstring knee motion; broad inner-thigh strokes. Keep the thin anterior-shin area light-touch only.
- Contact diagrams, effort, one-repetition definitions and animation must change with the technique. The original Atlas hand may deform into a cupped grip; do not replace it with primitive fingers. Counts remain explicitly introductory practice, not doses inferred from the document.
- Use the complete original Atlas skin in full-body teaching scenes, including pelvis, legs and feet, over the retained anatomical layers. Remove the waist crop; do not leave disjoint muscle/bone surfaces as the full-body silhouette. Soft region tint is a location cue. Leg vertices must never receive arm weights.
- The supplied hamstring tutorial is adapted to light support and small knee motion; omit forceful arm-assisted pressure. Calf tutorials omit searching for and holding pressure on tender points. Keep the adaptations transparent in expanded source notes.

## No dead end after care advice — 2026-09-15

- Every care outcome must expose a primary “继续查看按摩指引” path for the selected region, while retaining immediate emergency calling where applicable. Saving directly remains available.
- Care-origin tutorials are an educational continuation of the same draft. Preserve the original answers and care plan through refresh, back and save; offer a route back to care advice and a save-record action on the tutorial.
- For explicit concerning symptoms, keep a compact current-advice reminder, pause demonstrations initially and omit invitations to try repetitions. Users can deliberately play the educational animation. Never record viewing as activity, remove risk answers, or unlock actual practice because a tutorial was viewed.

## In-app references and plain-language notices — 2026-09-15

- Avoid using “就医提醒” as a generic product label. Use concrete “当前建议” and “什么时候先暂停” wording; retain explicit, proportionate urgent actions for concerning symptoms. Do not claim a word is banned or that these changes guarantee platform approval.
- Keep all reference reading in-app. No external website, source-download, new-tab or dialer links in tutorial, care or about views. Source names and model licensing/attribution remain readable text; keep the provenance metadata intact.
- Show emergency phone numbers as accessible static text, with an instruction to use the phone app. Disable automatic telephone/email/address link detection where supported.
- Preserve the care → tutorial → record continuation. Plain wording and local references must not erase reported risk or imply that watching a lesson authorizes practice.

## Supine intersection regression — 2026-09-15

- Classify arm versus torso skin below the armpit using source-mesh connectivity, not only coordinate cutoffs. Waist vertices must not follow the wrists.
- Render only the continuous skin as the full-body teaching surface; retain internal anatomy data without drawing independently deformed layers through that surface.
- Supine hand landmarks are wrists, not fingertips. Place wrists below/behind the supported thigh and solve elbows with fixed upper/forearm lengths so the original hands are not enlarged into the leg.
- Verify both sides from a lateral camera and exercise phases when changing this pose.

## Opaque clothing — 2026-09-15

- Every full-body teaching model must wear opaque sports shorts. Genitals and their contours must never be displayed; coloring the naked skin is insufficient.
- Render a separate loose garment bound to the same pelvis/thigh skeleton, with waistband and leg hems. Exclude skin triangles fully inside the covered pelvis band, preserving arms and all uncovered skin. This deliberate covered-skin exclusion supersedes the earlier full-index-count requirement.
- Keep clothing present in seated, standing and supine poses on both sides, including paused animation.

## Clothing fit and hand clearance — 2026-09-15

- Derive sports shorts from the Atlas body surface, smooth the front to remove private anatomical contours, and retain only the outer of the scan's two overlapping shells. Do not use disconnected cylindrical shorts that stretch into hanging panels.
- Straighten garment openings and keep a small fabric offset. Covered anatomy remains excluded.
- Supine wrists need lateral clearance for the full original palm and fingers, not only for the wrist landmark. Check the rendered left/right side views and seated clothing after revisions.

## Crotch continuity and independent wrists — 2026-09-15

- Cut garment triangles at exact waist/hem planes; do not snap arbitrary scan boundary vertices into cuffs. Blend pelvis and both thighs continuously across the crotch.
- Full-body hands use independent wrist bones blended into the forearms. Supine fingers must run along the back of the thigh rather than inherit the forearm pointing direction.
- Check actual deformed palm/finger vertices against thigh clearance on both sides at multiple phases. Small whole-body screenshots are insufficient: inspect cropped/enlarged crotch, cuffs and hands.

## Cuff/body intersection — 2026-09-15

- Interior-triangle removal alone does not hide scan triangles crossing the garment edge. Full-body skin also needs fragment-level coverage clipping in original bind coordinates, excluding arms.
- Garment thickness must taper to zero at waist and leg openings, with matching cutoff planes. A constant outward offset creates floating strap-like cuffs.

## Cupped support hands — 2026-09-15

- Supine support uses cupped original Atlas fingers and palms facing inward around the underside of the thigh. Straight upright hands are not a correct teaching silhouette.
- Stagger the hands along the thigh and check left/right hand surface separation as well as distance from the thigh. Do not solve penetration merely by leaving open hands hovering behind the leg.

## Rebound full-body rig — 2026-09-15

- Full-body tutorials now use `BoundAtlasRig.js` and the baked GLB generated by Blender. The old `AtlasRig.js` is retained only for legacy extraction/regressions, not for full-body playback. Do not return to independent bone targets or direct finger vertex warps.
- Maintain the 51-bone parent hierarchy, 30 phalange joints, forearm twist bones, fixed segment lengths, normalized four-influence weights, opaque shorts and source attribution.
- Preserve original bind-surface connectivity. Welding coincident arm/thigh vertices destroys the anatomical region mask. Heat weights must be constrained by region; cloth crotch weights must remain continuous.
- Animation edits belong in `scripts/rig/build-rig.py` / the Blender source, then export all 12 named clips. Keep `rigVersion.js` synchronized so cached GLBs cannot survive a rebuild.
- Run `npm run check:rig` against the exported file. This checks hierarchy, phalanges, fixed attachments, deformation and actual deformed thigh-surface contact on both sides, not only sparse whole-body screenshots.

## Palm frame and reachable support — 2026-09-16

- Hand and finger rotations must preserve a complete anatomical frame (finger direction plus palm-facing normal). Aligning each bone's long axis alone loses wrist roll and twists the fingers away from the palm.
- Supine hands curl around the posterior thigh. Bring the supported thigh toward the torso enough that both wrists are reachable with bent elbows; do not silently clamp unreachable support targets.
- The source hands are asymmetric. Fit mirrored wrist positions to actual surfaces and validate both sides. Check palmar face orientation, bent elbows, thigh penetration and hand separation across the animation; a single close fingertip is insufficient evidence of a good pose.

## Whole-pose review and binding provenance — 2026-09-16

- Evaluate anatomical plausibility, the entire motion and multiple camera angles before calling an animation repaired. Include the head-side angle from user screenshots, both lateral views, an oblique close-up and the actual tutorial. Passing a sparse numerical test is insufficient.
- Supine support must contact the original mesh's anatomical posterior thigh. Use the bind normals to verify it; tint the posterior region rather than an entire thigh ring. Keep knees, ankles and feet coordinated, and leave space for the hands throughout knee flexion.
- `scripts/rig/audit-support.mjs` checks both sides at 13 phases: wrist bend/volume, palmar proximity and posterior contact, triangle intersections among hands/thigh/calf/foot/other leg/shorts, plus knee and foot clearances. Keep these in `npm run check:rig`.
- Preserve source-face provenance through visible-skin clipping. Copy original vertex weights and barycentrically interpolate newly cut vertices. Do not use nearest-surface transfer or indiscriminate welding for the visible body: the resting scan has nearly touching arm and torso surfaces. Preserve winding and weld only compatible weights.
- The shorts' sewn hem and exposed skin must share the same weights. Blend to the continuous crotch weights above the hem. Validate paired cuff vertices in all 12 clips.
- Keep twist weights out of the elbow hinge and avoid mixing an untwisted forearm directly with the rotated palm. Use a continuous axillary paint transition and regression checks for large stretched skin flaps.

## Region/action library and optional duration — 2026-09-16

- Home keeps the accepted silver/orange Atlas geometry in a large upright, near-frontal composition with no camera roll, cool rim light and restrained scan accents. Keep this presentation mode separate from touch/tutorial framing.
- Recovery library is region → explicit named action → tutorial. Seven region entries distinguish thigh front/back/inner/outer and calf front/back/outer. Explain that common regions are covered, not every deep muscle or all lower-limb tissues. The 24 entries reuse 6 hand techniques and 5 verified joint actions; do not market them as 24 unique movements.
- Outer thigh includes the IT band in its regional explanation; surface contact is on anterior-lateral muscle belly, not deep pressure on the band or bony lateral knee. Outer calf avoids the fibular head, bone and ankle. Use the existing real Atlas parts for region highlighting.
- Offer 30-second, 1-minute and 5-minute options in the action chooser and tutorial; guided recovery has the same duration picker. Duration/action deep links must validate inputs and preserve an unfinished assessment.
- Durations are optional relaxation sessions, not prescribed massage doses. Start with 1–3 trial repetitions; the first 30 seconds are demonstration/practice time, with longer sessions continuing as hands-off rest. Pause when hidden; keep counted practice time independent of planned time and rest. Changing duration never creates or erases counted practice.
- For care-origin lessons, preserve the care context and educational access; do not expose the practice timer or trial invitation. Source references remain in-app.
- Adjacent-region joint actions reuse the checked quads/shins clips through explicit mappings. Do not create new poses solely to inflate the action count.


## Concise main flow and shared recovery choices — 2026-09-16

- Home must stay upright, with an enlarged model. Do not tilt/roll the hero camera.
- Keep the main route to three focused screens: choose region → report feelings → choose action/time and follow the demo. The final screen must visibly show the named action picker and 30s/1min/5min durations above the 3D viewer, using the same action catalog as the recovery library.
- Location uses a full-width 3D model above a two-column grid of all seven region buttons (latest user preference). Keep remembered-region shortcuts and fit primary controls at 320×740 and 390×844 without a mandatory sport step.
- Keep symptom/onset and intensity reporting concise; preserve the original care logic. Detailed teaching/source notes open on demand.
- Persist `recoveryAction` and duration in the guided draft. Restore valid session URLs on refresh, preserve chosen actions through back/forward, migrate old movement/massage drafts, and never let direct URLs erase care context or invent symptom answers.
- Changing the action or planned duration pauses and resets that plan's countdown while retaining previously counted practice. Save the selected action and planned time separately from actual practice seconds. Care-only records do not imply an action was selected or performed.


## Body-note images and actionable care — 2026-09-16

- Offer detailed local PNG generation from history and record detail, with preview, save, and explicit native file sharing. Keep JSON export. Do not upload records or add external links. Missing ratings must remain unrecorded, never zero; include care notes and warnings in shared records.
- Ordinary mild discomfort continues to action/time choice. Suspected acute injury and red flags retain practice restrictions. Protect/settle care branches offer optional supported-rest timing and save; emergency/urgent branches must not introduce a waiting timer. Keep rest seconds separate from actual practice and never interpret timer completion as clearance to massage.


## Returning-user home shortcut — 2026-09-16

- After a saved first self-check, show “快速按摩” beside the home self-check button. Open the latest saved region's existing action/time chooser, restore a valid planned duration, and support older records with only a region name. No extra assessment is required and the unfinished draft remains intact. With no saved records, retain the single self-check entry.


## Automatic courses and tutorial audit — 2026-09-16 (latest)

- Guided practice now means a region-specific automatic sequence driven by the selected total duration, not a manual action picker or a single 30s action followed by a long generic rest. Main flow and quick/library automatic practice share `recoveryRoutine.js` and `GuidedRecovery.jsx`. Keep the per-step title, upcoming action, total timer and optional full-plan sheet.
- Single-action tutorials remain educational pages; their primary continuation enters the automatic course. Quick courses can save an honest body note with no invented self-check scores and must preserve an unfinished assessment draft.
- Track action seconds by timeline overlap, exclude prepare/transition/rest, retain stage logs in saved/shared notes, and never equate animated repetitions to completed user repetitions. Old one-action drafts restart the new course paused while retaining prior counted activity. Duration changes preserve past main-flow action logs separately.
- The independent close-up hand in `touchGuide.js` is a morph surface, not the bound full-body hand skeleton. Its kneading/thumb-pressure animations lack reliable thumb opposition/contact: withdraw these 3D demonstrations and exclude them from automatic plans; keep labelled text/contact explanations. Do not claim every tutorial has been clinically validated.
- Palm/soft-stroke paths follow sampled surface normals and return while lifted; controlled practice must use course elapsed time rather than a separate free-running animation clock. Full-body rig and baked clips are unchanged.
- Detailed evidence, remaining limitations and sources are in `qa/automatic-routine/tutorial-audit.md`. The user's request to remove acute-injury/red-flag practice restrictions was not implemented; ordinary mild discomfort remains ungated, and advice/tutorial/record continuation remains accessible.


## Restored articulated massage demos — 2026-09-16 (supersedes withdrawal)

- The user explicitly requested reliable replacements, not removal. Knead and thumb now use `BoundMassageHand.js` with `massage-hand.json`, extracted from the original bound Atlas surface by `scripts/rig/build-massage-hand.py`. Keep palm plus 15 independent phalanges and normalized weights. Do not route these gestures back to the legacy whole-hand morph.
- Use actual calf-envelope targets, independent thumb opposition, supporting four fingers, and a relaxed little-finger spread. Keep full orientation frames. Bone-driven poses use constrained web-skin correction and cached vertex playback; describe this accurately instead of claiming pure GPU skeletal playback or physical force simulation.
- Restore both direct tutorials and the calf automatic course: light → knead for short plans; light → knead → sweep → thumb → light → movement for 5 minutes. Do not add these actions to unsuitable regions.
- Run `npm run check:hand` after hand changes: dense cycle samples, sampled exact calf/finger triangle intersections, pad gaps, edge stretch, cycle seam and normalized weights. Inspect both sides and several camera angles as well. Current full-body rig remains unchanged.
- Keep the new JSON asset in mini-tool offline packing. Cache bust through `massageHandVersion.js` when the asset changes. The prototype remains the existing local preview; no hosting/access changes are part of this animation fix.

## Spherical contact markers — 2026-09-16 (latest user correction)

- The user rejected the stretched finger appearance and explicitly requested dots/spheres. Knead and thumb close-ups now use five independent spherical contact markers from `MassageContactPoints.js`; do not display the hand skin or web correction in these two lessons. This overrides earlier prohibitions on primitive finger representations for these two close-ups only.
- Orange identifies the thumb pad; four silver spheres identify the supporting finger pads. Knead moves both opposing sides toward/away from the surface; thumb practice keeps the four supports stationary during contact. Keep all markers rigid, the default camera facing both sets, and the visible contact-point legend.
- Existing timings, left/right, lesson access, full-body model and other hand tutorials are unchanged. The legacy articulated hand assets remain authoring references, not the current demonstration.

## Rounded hand and unobstructed practice — latest 2026-09-16

- User prefers a recognizable hand over disconnected dots, but rejects stretched scan skin. Knead/thumb now use a rounded schematic palm with independent joined finger segments (`SchematicMassageHand.js`), not the warped continuous hand or isolated contact spheres. Keep a visible thumb pad and distinguish supporting fingers from the moving thumb.
- Practice/prepare/rest/completion copy must sit outside the 3D viewer. `session-rest-card` belongs in the instructions below; hide redundant in-canvas teaching captions in controlled guided courses. Do not dim or cover the model with a completion overlay.

## Visible synchronized massage playback — 2026-09-16

- Close-up massage framing centers on the hand and contact patch at about 0.43 m; do not frame the full thigh so small sweeps appear frozen. Apply timing easing once when reading spatial path samples.
- Interpolate the 100 ms course elapsed-time updates through `animationClock.js`, bound interpolation to 100 ms, and freeze exactly on pause. The same course clock drives preparation/transition previews without adding practice seconds; only action stages count.
- Preparation and transitions explicitly say they preview the upcoming action. Rest/completion explicitly say motion is paused, with text below the viewer. Preserve these distinctions rather than playing massage during rest.

## Translucent hands and reviewed contact paths — 2026-09-16

- Local massage/touch demonstration hands are translucent (roughly 40% opacity) so contact areas remain visible. Preserve recognizable hand shape, opaque anatomical muscle and bright surface markers. Course text remains outside the canvas.
- Pull local massage framing back to 0.62 m (0.50 m for calf grip), superseding the earlier 0.43 m preference. Preserve user zoom and rotation.
- Shared `massageGeometry.js` drives actual surface paths and regression checks. Mirror lateral circle offsets across legs; do not silently substitute an anchor for missed surface samples.
- Inner-thigh targets are mid/lower adductor longus/magnus, excluding proximal pectineus and gracilis from contact selection. The calf thumb must face medially on either leg. Hamstring sweep/light use supported sitting; pin uses supine support.
- Describe positions as contact regions, not therapeutic points or acupoints. Evidence supports some general techniques; exact model coordinates, force and time are not clinically validated. See `qa/massage-science-audit.md`.

## Smooth course transitions — 2026-09-16

- Preserve the 3D scene across preparation, action, transition and rest; do not use timeline step IDs as scene keys. Preserve user camera adjustments except when framing genuinely changes between techniques.
- During transitions show the released outgoing gesture, fade out before changing hands/scenes, then fade in the upcoming ready pose. Short transitions hold the ready pose; longer ones may preview one complete cycle ending at the ready pose. All timing follows the course clock and pauses with it.
- Preparation previews must finish at the same phase as the next action starts; rest retains the outgoing final pose. Exclude transitions/previews from activity accounting.
- The user asked to discuss 30-second/1-minute massage durations. Keep the existing duration choices and saved-course timing during this transition fix; do not silently treat a proposed 3-minute option as agreed. Short options should be discussed as trials/brief experiences, not validated treatment doses.

## Accepted durations, one-click start and contact contrast — 2026-09-16

- Main duration choices are 1 / 3 / 5 minutes, per side and region. Keep a separate 30-second trial entry. Thirty seconds and one minute use a single technique; 3 minutes use three action blocks; 5 minutes repeat the three-block sequence with release breaks. These are editorial pacing, not clinical doses.
- Clicking the library or single-lesson “开始自动跟练” starts the course immediately, including preparation. Explicit start requests are in-memory, not URL/history flags: fresh direct links, refresh and browser back remain paused. Changing duration or side pauses the course.
- Routine version 2 changes action layout; preserve old v1 practice seconds and labelled step history when migrating drafts, reset the new timeline, and never reinterpret old step IDs as new actions.
- Contact dots, rings and local paths are bright cyan against orange muscle. Keep hand materials translucent. The palm diagram's orange indicates which finger/palm surface to use, while cyan marks 3D contact location.
