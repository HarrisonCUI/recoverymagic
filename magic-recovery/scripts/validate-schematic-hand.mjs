import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createSchematicMassageHand } from '../src/SchematicMassageHand.js';
const surface={normal:p=>new THREE.Vector3(0,p.y+.099,p.z+.025).normalize(),cy:-.099,cz:-.025,r:.04,point:(x,a,gap)=>new THREE.Vector3(x,-.099+(.04+gap)*Math.sin(a),-.025+(.04+gap)*Math.cos(a))};
for(const technique of ['knead','thumb']){
 const demo=createSchematicMassageHand(surface,technique);
 assert.equal(demo.fingers.length,5);
 const start=demo.mesh.children.map(m=>m.position.clone());
 const geometry=demo.mesh.children.map(m=>Array.from(m.geometry.attributes.position.array));
 for(let sample=0;sample<=128;sample++){
  demo.update(sample/16);
  for(const finger of demo.fingers){
   assert.equal(finger.joints.length,4);assert.equal(finger.links.length,3);
   for(const joint of finger.joints){assert.deepEqual(joint.scale.toArray(),[1,1,1]);assert.ok(joint.position.toArray().every(Number.isFinite));}
   finger.links.forEach((link,i)=>{
    const a=finger.joints[i].position,b=finger.joints[i+1].position;
    assert.ok(link.position.distanceTo(a.clone().lerp(b,.5))<1e-10);
    assert.ok(Math.abs(link.scale.y-a.distanceTo(b))<1e-10);
   });
  }
 }
 demo.mesh.children.forEach((m,i)=>{
  assert.ok(m.position.distanceTo(start[i])<1e-10);
  assert.deepEqual(Array.from(m.geometry.attributes.position.array),geometry[i]);
  assert.equal(m.isSkinnedMesh,undefined);
 });
 demo.update(1.5);const support=demo.fingers[2].joints[3].position.clone(),thumb=demo.fingers[4].joints[3].position.clone();
 demo.update(3.75);
 assert.ok(demo.fingers[4].joints[3].position.distanceTo(thumb)>.006);
 const supportTravel=demo.fingers[2].joints[3].position.distanceTo(support);
 assert.ok(technique==='thumb'?supportTravel<1e-10:supportTravel>.006);
 demo.mesh.children.forEach(m=>{m.geometry.dispose();m.material.dispose();});
}
console.log('PASS: five connected articulated fingers, unchanged surface geometry, stable support digits and seamless motion');
