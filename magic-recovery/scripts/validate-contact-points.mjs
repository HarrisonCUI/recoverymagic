import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createMassageContactPoints } from '../src/MassageContactPoints.js';

const surface = { point: (x,a,gap) => new THREE.Vector3(x, (.04+gap)*Math.sin(a), (.04+gap)*Math.cos(a)) };
for (const technique of ['knead', 'thumb']) {
  const demo = createMassageContactPoints(surface, technique);
  assert.equal(demo.mesh.children.length, 5);
  const start = demo.mesh.children.map(m=>m.position.clone());
  for (let i=0;i<=128;i++) {
    demo.update(i/16);
    for (const {sphere,radius} of demo.markers.values()) {
      assert.equal(sphere.geometry.type, 'SphereGeometry');
      assert.equal(sphere.isSkinnedMesh, undefined);
      assert.deepEqual(sphere.scale.toArray(), [1,1,1]);
      assert.ok(Math.hypot(sphere.position.y,sphere.position.z)-radius>.0419);
    }
  }
  demo.mesh.children.forEach((m,i)=>assert.ok(m.position.distanceTo(start[i])<1e-10));
  demo.update(1.5);
  const support=demo.markers.get('middle').sphere.position.clone();
  const thumb=demo.markers.get('thumb').sphere.position.clone();
  demo.update(3.75);
  assert.ok(demo.markers.get('thumb').sphere.position.distanceTo(thumb)>.007);
  const supportTravel=demo.markers.get('middle').sphere.position.distanceTo(support);
  assert.ok(technique==='thumb' ? supportTravel<1e-10 : supportTravel>.007);
  demo.mesh.children.forEach(m=>{m.geometry.dispose();m.material.dispose();});
}
console.log('PASS: five rigid spherical pads, distinct knead/thumb motion, stationary supports, clearance and seamless loops');
