import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {muscles} from '../src/data.js';
import {MASSAGES} from '../src/massage.js';
import {massageAnchor,massageMeshes,sampleMassagePath} from '../src/massageGeometry.js';
import {createCalfSurface} from '../src/BoundMassageHand.js';
const {parts}=JSON.parse(readFileSync(new URL('../public/models/legs.json',import.meta.url)));
const bytes=readFileSync(new URL('../public/models/legs.bin',import.meta.url));
const meshes=parts.map(p=>{
 const g=new THREE.BufferGeometry(),v=new Float32Array(p.vertexCount*3),ix=new Uint32Array(p.indexCount);
 for(let i=0;i<v.length;i++)v[i]=bytes.readFloatLE(p.positions+i*4);
 for(let i=0;i<ix.length;i++)ix[i]=bytes.readUInt32LE(p.indices+i*4);
 g.setAttribute('position',new THREE.BufferAttribute(v,3));g.setIndex(new THREE.BufferAttribute(ix,1));
 const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial());
 m.userData={name:p.name,group:muscles.find(r=>r.match.test(p.name))?.id,side:/left/i.test(p.name)?'left':'right'};return m;
});
let paths=0,points=0;
for(const r of muscles)for(const side of ['left','right']){
 const a=massageAnchor(meshes,r.id,side),chosen=massageMeshes(meshes,r.id,side);
 for(const technique of MASSAGES[r.id].techniques.filter(t=>!['pin','knead','thumb'].includes(t))){
  const path=sampleMassagePath(a,chosen,technique,MASSAGES[r.id].travel,side);
  // Bounds are model-space review envelopes, not clinical clearance distances.
  const band=['calves','shins','outercalf'].includes(r.id)?[.20,.41]:[.56,.73];
  let maxStep=0;
  path.samples.forEach((p,i)=>{
   assert.ok(p.y>band[0]&&p.y<band[1],`${r.id}/${side} outside reviewed mid-muscle band`);
   assert.ok(!/pectineus|gracilis|iliotibial|tendon|bone/i.test(path.names[i]));
   if(i)maxStep=Math.max(maxStep,p.distanceTo(path.samples[i-1]));
  });
  assert.ok(maxStep<.009,`${r.id}/${side} discontinuity ${maxStep}`);
  paths++;points+=path.samples.length;
  console.log(`${r.id}/${side}/${technique}: ${[...new Set(path.names)].join(', ')}; max step ${(maxStep*1000).toFixed(2)} mm`);
 }
 if(r.id==='calves'){
  const surface=createCalfSurface(chosen,a,side);
  const pads=[[-.039,.99],[-.02,.99],[0,.99],[.02,.99],[.036,-.82]];
  for(const [x,angle]of pads){
   const p=surface.point(x,angle,.0015).applyMatrix4(surface.matrix);
   const direction=p.clone().sub(surface.center.clone().addScaledVector(surface.axial,x)).normalize();
   const hit=new THREE.Raycaster(p.clone().addScaledVector(direction,.1),direction.clone().negate()).intersectObjects(chosen)[0];
   assert.ok(hit);assert.ok(p.distanceTo(hit.point)<.004,'pad must coincide with actual calf surface');
   assert.ok(p.y>.27&&p.y<.40);
  }
  const thumb=surface.point(.036,-.82).applyMatrix4(surface.matrix);
  assert.ok((thumb.x-surface.center.x)*(side==='right'?1:-1)>0,'thumb is on medial calf');
 }
}
console.log(`PASS: ${paths} paths / ${points} surface samples, 10 calf pad targets; both sides. Geometry validation is not clinical validation.`);
