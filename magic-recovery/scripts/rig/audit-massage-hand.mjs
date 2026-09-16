import fs from 'node:fs';
import * as THREE from 'three';
import {buildMassageHand,createCalfSurface,createMassagePlayback} from '../../src/BoundMassageHand.js';
import {muscles} from '../../src/data.js';
const asset=JSON.parse(fs.readFileSync('public/models/massage-hand.json'));
const meta=JSON.parse(fs.readFileSync('public/models/legs.json')),raw=fs.readFileSync('public/models/legs.bin');
const buffer=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength);
const report=[],errors=[];
const require=(ok,message)=>{if(!ok)errors.push(message);};
require(asset.bones.length===16,'Expected palm plus fifteen phalanges');
for(let i=0;i<asset.skinWeights.length;i+=4)require(Math.abs(asset.skinWeights.slice(i,i+4).reduce((a,b)=>a+b,0)-1)<1e-5,`Unnormalized vertex ${i/4}`);
function triangles(indices,points){const out=[];for(let k=0;k<indices.length;k+=3){const tri=new THREE.Triangle(...indices.slice(k,k+3).map(i=>points[i]));out.push({tri,box:new THREE.Box3().setFromPoints([tri.a,tri.b,tri.c])});}return out;}
function crossings(first,second){let count=0;const ray=new THREE.Ray(),hit=new THREE.Vector3();for(const x of first)for(const y of second){if(!x.box.intersectsBox(y.box))continue;let crossing=false;for(const [a,b] of [[x,y],[y,x]]){const pts=[a.tri.a,a.tri.b,a.tri.c];for(let i=0;i<3;i++){const length=pts[i].distanceTo(pts[(i+1)%3]);ray.set(pts[i],pts[(i+1)%3].clone().sub(pts[i]).normalize());if(ray.intersectTriangle(b.tri.a,b.tri.b,b.tri.c,false,hit)&&hit.distanceTo(pts[i])<length-1e-5&&hit.distanceTo(pts[i])>1e-5){crossing=true;break;}}if(crossing)break;}if(crossing)count++;}return count;}

for(const side of ['right','left']) {
 const region=muscles.find(m=>m.id==='calves');
 const meshes=meta.parts.filter(p=>region.match.test(p.name)&&p.name.toLowerCase().includes(side)).map(p=>{
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(buffer,p.positions,p.vertexCount*3).slice(),3));g.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer,p.indices,p.indexCount).slice(),1));g.computeVertexNormals();const mesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld();return mesh;});
 const sign=side==='right'?-1:1,point=new THREE.Vector3(Math.abs(region.point[0])*sign,region.point[1],region.point[2]),normal=new THREE.Vector3(0,0,-1);
 const ray=new THREE.Raycaster(point.clone().addScaledVector(normal,.6),normal.clone().negate());point.copy(ray.intersectObjects(meshes)[0].point);
 const surface=createCalfSurface(meshes,{point,normal},side),rig=buildMassageHand(asset);
  const digitFaces=Object.fromEntries(Object.keys(asset.chains).map(d=>{
 const ids=[];for(let i=0;i<asset.indices.length;i+=3){const tri=asset.indices.slice(i,i+3);if(tri.every(v=>asset.positions[v*3+1]>-.065&&[0,1,2,3].reduce((sum,k)=>sum+(asset.bones[asset.skinIndices[v*4+k]].name.startsWith(d)?asset.skinWeights[v*4+k]:0),0)>.75))ids.push(...tri);}return [d,ids];}));
 const calfTris=meshes.flatMap(m=>triangles(Array.from(m.geometry.index.array),Array.from({length:m.geometry.attributes.position.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(m.geometry.attributes.position,i))));
 for(const technique of ['knead','thumb']) {
  const playback=createMassagePlayback(rig,surface,technique);
  for(let sample=0;sample<=128;sample++) {
   const seconds=sample/16;playback.update(seconds);
   rig.pose(surface,technique,seconds);
   let jointAngle=0;
   for(const digit of Object.keys(asset.chains)){
    const bs=[1,2,3].map(k=>rig.byName[digit+k]);
    const directions=bs.map(b=>new THREE.Vector3(0,1,0).applyQuaternion(b.getWorldQuaternion(new THREE.Quaternion())));
    for(let i=0;i<2;i++)jointAngle=Math.max(jointAngle,directions[i].angleTo(directions[i+1])*180/Math.PI);
   }
   const pads=Object.fromEntries(Object.keys(asset.pads).map(d=>[d,+surface.clearance(playback.pad(d)).toFixed(5)]));
   const pos=playback.mesh.geometry.attributes.position;
   const points=Array.from({length:pos.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(pos,i));
   const min=Math.min(...points.map(p=>surface.clearance(p)));
   let stretch=0;for(const [a,b,rest] of rig.edges)if(rest>.002)stretch=Math.max(stretch,points[a].distanceTo(points[b])/rest);
   // Exact triangle crossings at 17 phases supplement the dense radial-envelope test.
   const intersections=sample%8===0?crossings(triangles(asset.indices,points.map(p=>p.clone().applyMatrix4(surface.matrix))),calfTris):null;
   let fingerCrossings=null;
   if(sample%8===0){fingerCrossings=0;const patches=Object.values(digitFaces).map(ids=>triangles(ids,points));for(let i=0;i<patches.length;i++)for(let j=i+1;j<patches.length;j++){const count=crossings(patches[i],patches[j]);fingerCrossings+=count;}}
   const label=`${side}/${technique}@${seconds}`;
   require(jointAngle<125,`${label}: finger folds excessively (${jointAngle})`);
   require(fingerCrossings===null||fingerCrossings===0,`${label}: finger surfaces cross (${fingerCrossings})`);
   require(min>-.001,`${label}: skin penetrates calf (${min})`);
   require(stretch<2.5,`${label}: stretched web skin (${stretch})`);
   require(intersections===null||intersections===0,`${label}: hand/calf triangle intersections (${intersections})`);
   if(seconds>=1.5&&seconds<=6)require(Object.values(pads).every(g=>g>0&&g<.008),`${label}: pad does not remain close to surface`);
   report.push({side,technique,seconds,pads,jointAngle:+jointAngle.toFixed(1),min:+min.toFixed(5),stretch:+stretch.toFixed(3),intersections,fingerCrossings});
  }
  const first=playback.frames[0],last=playback.frames.at(-1);
  require(first.every((v,i)=>Math.abs(v-last[i])<1e-6),`${side}/${technique}: cycle seam`);
  playback.mesh.geometry.dispose();playback.mesh.material.dispose();
 }
 rig.mesh.geometry.dispose();rig.mesh.material.dispose();rig.mesh.skeleton.dispose();
 for(const mesh of meshes){mesh.geometry.dispose();mesh.material.dispose();}

}
fs.mkdirSync('qa/massage-hand',{recursive:true});fs.writeFileSync('qa/massage-hand/contact-audit.json',JSON.stringify({samples:report,errors},null,2));
console.log(JSON.stringify({samples:report.length,triangleChecks:report.filter(r=>r.intersections!==null).length,minClearance:Math.min(...report.map(r=>r.min)),maxJointAngle:Math.max(...report.map(r=>r.jointAngle)),maxStretch:Math.max(...report.map(r=>r.stretch)),errors},null,2));
if(errors.length)process.exitCode=1;
