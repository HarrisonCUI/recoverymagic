import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { muscles } from "./data.js";
import { movementPose } from "./motions.js";

// Original Human Atlas coordinates. Independent bind bones keep the original
// anatomical mesh, while GPU skinning adapts it to the teaching poses.
export const ATLAS_BIND = [
  [0, 0.9, -0.025],
  [0.09, 0.9, -0.025],
  [0.077, 0.45, -0.022],
  [0.082, 0.085, -0.018],
  [-0.09, 0.9, -0.025],
  [-0.077, 0.45, -0.022],
  [-0.082, 0.085, -0.018],
  [0.185, 1.39, -0.025],
  [0.228, 1.11, -0.015],
  [-0.185, 1.39, -0.025],
  [-0.228, 1.11, -0.015],
  [0.265, 0.89, 0.005],
  [-0.265, 0.89, 0.005],
];
const smooth = (a, b, x) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
// Arms and trunk touch in projection, so x/y thresholds alone can assign
// waist vertices to the wrists. Below the armpit they are separate connected
// surface components; classify those components once when loading the mesh.
export function atlasSkinArmMask(positions, indices) {
  const count = positions.length / 3, parent = Int32Array.from({ length: count }, (_, i) => i);
  const root = (i) => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const join = (a, b) => { if (positions[a * 3 + 1] < 1.20 && positions[b * 3 + 1] < 1.20) parent[root(a)] = root(b); };
  for (let i = 0; i < indices.length; i += 3) { join(indices[i], indices[i + 1]); join(indices[i + 1], indices[i + 2]); join(indices[i + 2], indices[i]); }
  const totals = new Map();
  for (let i = 0; i < count; i++) {
    if (positions[i * 3 + 1] >= 1.20) continue;
    const key = root(i), value = totals.get(key) || [0, 0];
    value[0] += positions[i * 3]; value[1]++; totals.set(key, value);
  }
  return Int8Array.from({ length: count }, (_, i) => {
    if (positions[i * 3 + 1] >= 1.20) return 2;
    const [sum, n] = totals.get(root(i));
    return Math.abs(sum / n) > 0.22 ? Math.sign(sum) : 0;
  });
}
export function atlasWeights(x, y, skin = false, armRegion = 2) {
  const left = x > 0,
    thigh = left ? 1 : 4,
    shin = thigh + 1,
    foot = thigh + 2;
  if (skin && (armRegion === 1 || armRegion === -1 || (armRegion === 2 && y > 0.72 && y < 1.43 && Math.abs(x) > (y > 1.16 ? 0.14 : 0.205)))) {
    const arm = left ? 7 : 9;
    if (y > 1.16) {
      // Blend the full shoulder/inner upper-arm width into the torso instead
      // of splitting its vertices at a hard x threshold when the arm bends.
      const w = smooth(0.14, 0.195, Math.abs(x));
      return [[0, arm], [1 - w, w]];
    }
    if (y < 0.96) {
      const forearm = smooth(0.875, 0.945, y);
      return [[arm + 1, left ? 11 : 12], [forearm, 1 - forearm]];
    }
    const w = smooth(1.07, 1.16, y);
    return [[arm, arm + 1], [w, 1 - w]];
  }
  if (y > 0.97)
    return [
      [0, 0],
      [1, 0],
    ];
  if (y > 0.84) {
    const w = smooth(0.84, 0.97, y);
    return [
      [0, thigh],
      [w, 1 - w],
    ];
  }
  if (y > 0.4) {
    const w = smooth(0.4, 0.5, y);
    return [
      [thigh, shin],
      [w, 1 - w],
    ];
  }
  const w = smooth(0.06, 0.13, y);
  return [
    [shin, foot],
    [w, 1 - w],
  ];
}
// Clip triangles at the sewn openings instead of snapping scan vertices.
function shortsGeometry(source, triangles, armMask) {
  const lo=0.705, hi=1.035, vertices=[], normals=[], mapped=new Map();
  let indices=[];
  function clip(poly, y, above) {
    const out=[];
    for(let i=0;i<poly.length;i++) {
      const a=poly[i],b=poly[(i+1)%poly.length], ai=above?a[1]>=y:a[1]<=y, bi=above?b[1]>=y:b[1]<=y;
      if(ai) out.push(a);
      if(ai!==bi){const t=(y-a[1])/(b[1]-a[1]);out.push(a.map((v,k)=>k===1?y:v+(b[k]-v)*t));}
    }
    return out;
  }
  const add=(v)=>{
    const key=v.map(x=>Math.round(x*1e6)).join(',');
    if(!mapped.has(key)){mapped.set(key,vertices.length/3);vertices.push(...v);}
    return mapped.get(key);
  };
  for(let t=0;t<triangles.length;t+=3){
    const ids=triangles.slice(t,t+3);
    if(!ids.every(i=>armMask[i]===0))continue;
    let poly=ids.map(i=>Array.from(source.slice(i*3,i*3+3)));
    poly=clip(clip(poly,lo,true),hi,false);
    for(let i=1;i<poly.length-1;i++)indices.push(add(poly[0]),add(poly[i]),add(poly[i+1]));
  }
  const parent=Array.from({length:vertices.length/3},(_,i)=>i);
  const root=(i)=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
  for(let t=0;t<indices.length;t+=3){parent[root(indices[t])]=root(indices[t+1]);parent[root(indices[t+1])]=root(indices[t+2]);}
  const shells=new Map();
  for(let i=0;i<parent.length;i++){const key=root(i),s=shells.get(key)||{n:0,r:0};s.n++;s.r+=vertices[i*3]**2+(vertices[i*3+2]+.025)**2;shells.set(key,s);}
  const outer=[...shells].filter(([,s])=>s.n>100).sort((a,b)=>b[1].r/b[1].n-a[1].r/a[1].n)[0][0];
  indices=indices.filter(i=>root(i)===outer);
  const neighbors=Array.from({length:parent.length},()=>new Set());
  for(let t=0;t<indices.length;t+=3){const[a,b,c]=indices.slice(t,t+3);neighbors[a].add(b).add(c);neighbors[b].add(a).add(c);neighbors[c].add(a).add(b);}
  let points=vertices.slice();
  for(let pass=0;pass<40;pass++){
    const next=points.slice();
    for(let i=0;i<parent.length;i++){
      const x=vertices[i*3], y=vertices[i*3+1];
      if(!neighbors[i].size||Math.abs(x)>.08||y<.74||y>.94)continue;
      for(let k=0;k<3;k++){let sum=0;for(const n of neighbors[i])sum+=points[n*3+k];next[i*3+k]=THREE.MathUtils.lerp(points[i*3+k],sum/neighbors[i].size,.65);}
    }
    points=next;
  }
  const si=[],sw=[],colors=[];
  for(let i=0;i<points.length;i+=3){
    const x=points[i],y=points[i+1];
    const rootWeight=smooth(.84,.97,y),left=smooth(-.045,.045,x);
    si.push(0,1,4,0);sw.push(rootWeight,(1-rootWeight)*left,(1-rootWeight)*(1-left),0);
    new THREE.Color(y>1.02||y<.72?0x4c5e69:0x354953).toArray(colors,colors.length);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const ns=geometry.attributes.normal.array;
  for(let i=0;i<points.length;i+=3){
    // Fabric tapers into the body at sewn openings. A constant offset left
    // the waistband/cuffs floating like straps above the thighs.
    const y=points[i+1],thickness=.006*smooth(lo,lo+.025,y)*(1-smooth(hi-.02,hi,y));
    for(let k=0;k<3;k++)points[i+k]+=ns[i+k]*thickness;
  }
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  return geometry;
}
let asset;
function loadAsset() {
  if (!asset)
    asset = Promise.all([
      fetch("/models/movement.json").then((r) => {
        if (!r.ok) throw Error("Atlas metadata");
        return r.json();
      }),
      fetch("/models/movement.bin").then((r) => {
        if (!r.ok) throw Error("Atlas geometry");
        return r.arrayBuffer();
      }),
    ]).catch((e) => {
      asset = null;
      throw e;
    });
  return asset;
}
export async function createAtlasRig(
  scene,
  selected,
  side,
  isDisposed = () => false,
  poseSource = movementPose,
) {
  const [meta, buffer] = await loadAsset();
  const isSupine = Boolean(poseSource(selected,0,side).supine);
  if (isDisposed()) return null;
  let garment;
  const buckets = [[], [], [], []],
    region = muscles.find((m) => m.id === selected);
  for (const part of meta.parts) {
    const skin = part.name === "Skin";
    const positions = new Float32Array(
      buffer,
      part.positions,
      part.vertexCount * 3,
    );
    const packedNormals = new Int16Array(
      buffer,
      part.normals,
      part.vertexCount * 3,
    );
    let indices = Array.from(
      new Uint32Array(buffer, part.indices, part.indexCount),
    );
    // Keep the limbs and torso intact; covered pelvis triangles are removed
    // below only after arm connectivity has been classified.
    if (!indices.length) continue;
    const armMask = skin ? atlasSkinArmMask(positions, indices) : null;
    if (skin) {
      garment = shortsGeometry(positions, indices, armMask);
      const covered = (v) => armMask[v] === 0 && positions[v * 3 + 1] > 0.72 && positions[v * 3 + 1] < 1.015;
      const visible = [];
      for (let i = 0; i < indices.length; i += 3) {
        const triangle = indices.slice(i, i + 3);
        if (!triangle.every(covered)) visible.push(...triangle);
      }
      indices = visible;
    }
    const normals = Float32Array.from(packedNormals, (n) => n / 32767),
      si = new Uint16Array(part.vertexCount * 4),
      sw = new Float32Array(part.vertexCount * 4);
    for (let i = 0; i < part.vertexCount; i++) {
      const [ids, weights] = atlasWeights(
        positions[i * 3],
        positions[i * 3 + 1],
        skin,
        armMask ? armMask[i] : 2,
      );
      si[i * 4] = ids[0];
      si[i * 4 + 1] = ids[1];
      sw[i * 4] = weights[0];
      sw[i * 4 + 1] = weights[1];
    }
    const geo = new THREE.BufferGeometry();
    const posedPositions=positions.slice();
    if(skin && isSupine) {
      for(let v=0;v<part.vertexCount;v++) {
        if(Math.abs(armMask[v])!==1)continue;
        const y=positions[v*3+1], length=Math.max(0,.815-y);
        if(!length)continue;
        // Bend the original finger surface around the knuckles, retaining
        // the palm and a smooth tangent instead of leaving straight fingers.
        const radius=.070,angle=Math.min(1.25,length/radius);
        posedPositions[v*3+1]=.815-radius*Math.sin(angle);
        posedPositions[v*3+2]+=radius*(1-Math.cos(angle));
      }
    }
    geo.setAttribute("position",new THREE.BufferAttribute(posedPositions,3));
    geo.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geo.setAttribute("skinIndex", new THREE.BufferAttribute(si, 4));
    geo.setAttribute("skinWeight", new THREE.BufferAttribute(sw, 4));
    if(skin) geo.setAttribute('clothedBody',new THREE.Float32BufferAttribute(Array.from(armMask,v=>v===0?1:0),1));
    geo.setIndex(indices);
    if(skin && isSupine) geo.computeVertexNormals();
    const colors = new Float32Array(part.vertexCount * 3);
    const neutral = new THREE.Color(0xabb9bb), accent = new THREE.Color(0xf29b67);
    for (let v = 0; v < part.vertexCount; v++) {
      const x = positions[v * 3], y = positions[v * 3 + 1], z = positions[v * 3 + 2];
      const c = neutral.clone();
      if (skin) {
        const onSide = side === "left" ? x > 0 : x < 0;
        const ranges = { quads: [0.49, 0.80], hamstrings: [0.49, 0.80], adductors: [0.53, 0.79], calves: [0.18, 0.41], shins: [0.16, 0.40], outerthigh: [0.49, 0.80], outercalf: [0.16, 0.40] };
        const [lo, hi] = ranges[selected];
        const band = smooth(lo, lo + 0.045, y) * (1 - smooth(hi - 0.04, hi, y));
        const facing = ["calves", "hamstrings"].includes(selected) ? 1 - smooth(-0.06, 0.01, z) : selected === "adductors" ? 1 - smooth(0.035, 0.10, Math.abs(x)) : smooth(-0.015, 0.04, z);
        if (onSide) c.lerp(accent, band * facing * 0.8);
      } else c.set(0xffffff);
      c.toArray(colors, v * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const active =
      region.match.test(part.name) && part.name.toLowerCase().includes(side);
    buckets[skin ? 3 : active ? 1 : part.system === "skeletal" ? 2 : 0].push(geo);
  }
  const bones = ATLAS_BIND.map((p) => {
    const b = new THREE.Bone();
    b.position.set(...p);
    scene.add(b);
    b.updateMatrixWorld(true);
    return b;
  });
  const skeleton = new THREE.Skeleton(bones);
  const materials = [
    new THREE.MeshStandardMaterial({
      color: 0xabb9bb,
      metalness: 0.25,
      roughness: 0.47,
    }),
    new THREE.MeshStandardMaterial({
      color: 0xff793e,
      metalness: 0.18,
      roughness: 0.4,
      emissive: 0x9b340b,
      emissiveIntensity: 0.25,
    }),
    new THREE.MeshStandardMaterial({
      color: 0x77858a,
      metalness: 0.15,
      roughness: 0.6,
    }),
  ];
  const skinMaterial=new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 0.12, roughness: 0.65 });
  // Scan triangles straddle a hem. Clip covered skin per fragment as well as
  // removing interior triangles, so large triangles cannot poke through cuffs.
  skinMaterial.onBeforeCompile=(shader)=>{
    shader.vertexShader='attribute float clothedBody; varying vec2 clothingCoord;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n clothingCoord=vec2(position.y,clothedBody);');
    shader.fragmentShader='varying vec2 clothingCoord;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\n if(clothingCoord.y>.99 && clothingCoord.x>.705 && clothingCoord.x<1.035) discard;');
  };
  skinMaterial.customProgramCacheKey=()=> 'atlas-clothed-skin-v1';
  materials.push(skinMaterial);
  for (let i = 0; i < buckets.length; i++) {
    if (!buckets[i].length) continue;
    const geometry = mergeGeometries(buckets[i]);
    buckets[i].forEach((g) => g.dispose());
    const mesh = new THREE.SkinnedMesh(geometry, materials[i]);
    mesh.name = i === 3 ? "Atlas continuous body skin" : "Atlas anatomical layer";
    // The teaching person uses a closed skin surface. Internal anatomy remains
    // available as data, but independent layers must not protrude through it.
    mesh.visible = i === 3;
    mesh.bind(skeleton);
    mesh.frustumCulled = false;
    scene.add(mesh);
  }
  const shorts = new THREE.SkinnedMesh(garment, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide,
  }));
  shorts.name = "Atlas opaque sports shorts";
  shorts.bind(skeleton);
  shorts.frustumCulled = false;
  scene.add(shorts);
  const v = (a) => new THREE.Vector3(...a);
  function segment(index, targetStart, targetEnd, neutralEnd) {
    const neutral = v(neutralEnd).sub(v(ATLAS_BIND[index]));
    const delta = v(targetEnd).sub(v(targetStart));
    const bone = bones[index];
    bone.position.set(...targetStart);
    bone.quaternion.setFromUnitVectors(
      neutral.clone().normalize(),
      delta.clone().normalize(),
    );
    // Uniform scale avoids collapsed muscle cross-sections when the knee bends.
    bone.scale.setScalar(delta.length() / neutral.length());
  }
  function update(t) {
    const p = poseSource(selected, t, side),
      j = p.joints;
    bones[0].position.set(...j.pelvis);
    bones[0].quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v(j.chest).sub(v(j.pelvis)).normalize());
    bones[0].scale.set(1.08, 0.8, 1);
    for (const name of ["left", "right"]) {
      const i = name === "left" ? 1 : 4,
        a = name === "left" ? 7 : 9;
      segment(i, j[name + "Hip"], j[name + "Knee"], ATLAS_BIND[i + 1]);
      segment(i + 1, j[name + "Knee"], j[name + "Ankle"], ATLAS_BIND[i + 2]);
      bones[i + 2].position.set(...j[name + "Ankle"]);
      bones[i + 2].rotation.set(p.feet[name].x, 0, p.feet[name].z);
      bones[i + 2].scale.setScalar(1);
      segment(a, j[name + "Shoulder"], j[name + "Elbow"], ATLAS_BIND[a + 1]);
      const sign = name === "left" ? 1 : -1;
      segment(a + 1, j[name + "Elbow"], j[name + "Hand"], [
        sign * 0.265,
        0.89,
        0.005,
      ]);
      const hand=bones[name==='left'?11:12];
      hand.position.set(...j[name+'Hand']);
      hand.quaternion.copy(bones[a+1].quaternion);
      hand.scale.copy(bones[a+1].scale);
      if(p.supine){
        // Palm faces the thigh; fingers run around its underside. The two
        // hands are staggered along the thigh, so fingers cannot interlace.
        const finger=new THREE.Vector3(-sign*.8,.268,-.536).normalize();
        const palm=new THREE.Vector3(-sign*.6,-.358,.716).normalize();
        const across=palm.clone().cross(finger).normalize();
        const basis=new THREE.Matrix4().makeBasis(across,finger.clone().negate(),palm);
        hand.quaternion.setFromRotationMatrix(basis);
        hand.scale.setScalar(1);
      }
    }
  }
  update(0);
  return { update, dispose: () => skeleton.dispose() };
}
