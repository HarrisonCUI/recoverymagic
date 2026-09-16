import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const bytes=fs.readFileSync('public/models/rigged/atlas-recovery.glb');
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const meshes=[];gltf.scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
assert.equal(meshes.length,2,'visible body and opaque shorts');
const bones=meshes[0].skeleton.bones;
assert.equal(bones.length,51,'hierarchy includes torso, twist bones and phalanges');
for(const side of ['L','R'])for(const digit of ['thumb','index','middle','ring','pinky']){
 const a=bones.find(b=>b.name===`${digit}1${side}`||b.name===`${digit}1.${side}`);
 assert.ok(a,`${digit}.${side} joint chain exists`);
 assert.ok(a.children.some(b=>b.isBone),'phalanges have actual parent-child joints');
}
for(const mesh of meshes){
 const {skinIndex,skinWeight}=mesh.geometry.attributes;
 for(let i=0;i<skinWeight.count;i++){
  let total=0;for(let k=0;k<4;k++){const w=skinWeight.array[i*4+k];assert.ok(w>=0&&Number.isFinite(w));assert.ok(skinIndex.array[i*4+k]<bones.length);total+=w;}
  assert.ok(Math.abs(total-1)<1e-4,'all exported weights normalized');
 }
 assert.equal(mesh.material.opacity,1);
}
assert.equal(gltf.animations.length,12);
const body=meshes.find(m=>m.name.startsWith('Atlas_Body')),cloth=meshes.find(m=>m!==body),cuffs=[];
const bp=body.geometry.attributes.position,cp=cloth.geometry.attributes.position;
const surfacePatches=[],bodyIndex=body.geometry.index.array;
for(let i=0;i<bodyIndex.length;i+=3){
 const indices=[bodyIndex[i],bodyIndex[i+1],bodyIndex[i+2]],tri=new THREE.Triangle(...indices.map(i=>new THREE.Vector3().fromBufferAttribute(bp,i))),center=tri.getMidpoint(new THREE.Vector3()),area=tri.getArea();
 if(center.y>1.08&&center.y<1.43&&Math.abs(center.x)>.1&&area>1e-5)surfacePatches.push({indices,area});
}
const clothHem=Array.from({length:cp.count},(_,i)=>i).filter(i=>Math.abs(cp.getY(i)-.705)<1e-5);
for(let i=0;i<bp.count;i++){
 if(Math.abs(bp.getY(i)-.705)>1e-5||Math.abs(bp.getX(i))>.2)continue;
 const p=new THREE.Vector3().fromBufferAttribute(bp,i);let distance=Infinity,match;
 for(const j of clothHem){const d=p.distanceTo(new THREE.Vector3().fromBufferAttribute(cp,j));if(d<distance){distance=d;match=j;}}
 if(distance<1e-4)cuffs.push([i,match]);
}
assert.ok(cuffs.length>100,'paired sewn garment/skin hem exists');
const mixer=new THREE.AnimationMixer(gltf.scene);
let worstCuffGap=0,worstSurfaceStretch=0;
for(const clip of gltf.animations){
 mixer.stopAllAction();const action=mixer.clipAction(clip);action.play();
 let first,last,previousLengths;
 for(const time of [0,1.5,3,4.5,5.9999]){
  mixer.setTime(time);gltf.scene.updateMatrixWorld(true);meshes.forEach(m=>m.skeleton.update());
  for(const b of bones)assert.ok(b.scale.distanceTo(new THREE.Vector3(1,1,1))<1e-4,'bones do not stretch');
  const lengths=bones.filter(b=>b.parent?.isBone).map(b=>b.getWorldPosition(new THREE.Vector3()).distanceTo(b.parent.getWorldPosition(new THREE.Vector3())));
  if(previousLengths)lengths.forEach((l,i)=>assert.ok(Math.abs(l-previousLengths[i])<.0001,'fixed bone attachments across animation'));
  previousLengths=lengths;
  for(const [i,j] of cuffs){
   const skin=body.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(body.matrixWorld),fabric=cloth.getVertexPosition(j,new THREE.Vector3()).applyMatrix4(cloth.matrixWorld);
   const gap=skin.distanceTo(fabric);worstCuffGap=Math.max(worstCuffGap,gap);
   assert.ok(gap<.0035,`${clip.name}: sewn shorts cuff separates from the leg (${gap})`);
  }
  for(const patch of surfacePatches){
   const tri=new THREE.Triangle(...patch.indices.map(i=>body.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(body.matrixWorld))),stretch=tri.getArea()/patch.area;
   worstSurfaceStretch=Math.max(worstSurfaceStretch,stretch);
   assert.ok(stretch<20,`${clip.name}: shoulder skin forms a stretched flap (${stretch}x area)`);
  }
  const points=meshes.flatMap(mesh=>Array.from({length:256},(_,i)=>mesh.getVertexPosition(Math.floor(i*mesh.geometry.attributes.position.count/256),new THREE.Vector3()).applyMatrix4(mesh.matrixWorld)));
  assert.ok(points.every(v=>v.toArray().every(Number.isFinite)));
  const box=new THREE.Box3().setFromPoints(points);assert.ok(box.getSize(new THREE.Vector3()).length()<3,'no exploded or detached mesh');
  if(time===0)first=points;if(time===3)last=points;
 }
 assert.ok(first.some((v,i)=>v.distanceTo(last[i])>.003),`${clip.name} visibly moves`);
}
console.log(`PASS: ${bones.length} hierarchical bones, 30 finger joints, 12 baked clips, normalized skin, fixed attachments and bounded deformation`);
console.log(`PASS: ${cuffs.length} paired cuff vertices across all clips; maximum gap ${(worstCuffGap*1000).toFixed(2)} mm`);
console.log(`PASS: no catastrophic shoulder skin flaps; maximum sampled triangle area ratio ${worstSurfaceStretch.toFixed(2)}`);
// Keep support goals inside the actual arm reach, independently of skin checks.
for(const side of ['left','right']){
 mixer.stopAllAction();mixer.clipAction(gltf.animations.find(c=>c.name===`supine-${side}`)).play();
 for(const phase of [0,1.5,3,4.5]){
  mixer.setTime(phase);gltf.scene.updateMatrixWorld(true);
  for(const suffix of ['L','R']){
   const joint=name=>bones.find(b=>b.name.replace('.','')===name+suffix).getWorldPosition(new THREE.Vector3());
   const shoulder=joint('upper_arm'),elbow=joint('forearm'),wrist=joint('hand');
   assert.ok(shoulder.distanceTo(wrist)<.98*(shoulder.distanceTo(elbow)+elbow.distanceTo(wrist)),'support preserves elbow bend');
  }
 }
}
console.log('PASS: mirrored support targets are reachable with bent elbows');
