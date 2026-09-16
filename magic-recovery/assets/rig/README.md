# Atlas full-body binding

The full-body teaching figure uses `public/models/rigged/atlas-recovery.glb` through `src/BoundAtlasRig.js`.

- `atlas-bound.blend`: rest skeleton and bound surfaces.
- `atlas-animated.blend`: the same rig with 12 baked NLA clips.
- 51 parented bones, including 30 finger joints and two forearm twist bones.
- Blender heat diffusion followed by anatomical-region constraints and normalized four-influence export.
- Two-bone arm IK is baked; runtime playback uses AnimationMixer, without vertex-position pose edits.

## Rebuild

From the project root:

```sh
node scripts/rig/export-poses.mjs
# Only needed if the garment source geometry changes:
node scripts/rig/export-clothing.mjs
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python-exit-code 1 --python scripts/rig/build-rig.py
npm run check:rig
```

The build updates the GLB, Blender files, rig report and `src/rigVersion.js`. Inspect the local `/qa/rebind/rig-review.html` page with the skeleton toggle and phase control after changing an animation. Each action is named `region-side`; `supine-left` and `supine-right` are the supported-thigh massage demonstrations.

Preserve original bind-mesh connectivity: coincident arm and thigh vertices in the scan must not be welded before anatomical classification. Cloth is a separate opaque skinned surface. The visible body is clipped at its covered openings; the complete source surface remains hidden in the authoring file.

Support hands use `contact_orientation` to preserve a complete finger/palm frame through the phalanges. Do not replace this with shortest-arc bone-direction alignment: it loses roll and creates the inverted/open palm artifact. `SUPPORT_WRISTS` contains surface-fitted positions for the asymmetric source hands. The support IK rejects targets beyond 98% of total arm length so the elbow stays bent. Preserve the corresponding supine hip angle when editing these positions.

Source geometry: Human Atlas / BodyParts3D, CC BY 4.0. The rig and garment are adaptations. Existing in-app attribution remains in place.

## Whole-pose regression

`npm run check:rig` runs structural and cuff-seam checks for all 12 clips, then `scripts/rig/audit-support.mjs` over 26 mirrored supine samples. The latter writes `qa/whole-pose/surface-audit.json`. It checks anatomical posterior contact, wrist angle/volume, close palm contact, actual triangle crossings between the hands and both legs/shorts, and foot clearance. Review the exported model from multiple directions as well; these checks are pose regressions, not a general physics simulation.

Visible-body weights come directly from original source vertices/faces through the clothing cut, rather than nearest-surface transfer. Preserve that provenance, surface winding and weight-aware vertex merging. The cuff uses the visible skin's matching weights at the seam, then blends into the garment's continuous hip weights. Forearm twist, wrist and axillary weight transitions are deliberately constrained to prevent collapsed wrists and stretched skin flaps.
