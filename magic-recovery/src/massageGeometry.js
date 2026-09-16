import * as THREE from "three";
import { muscles } from "./data.js";

export function massageMeshes(meshes, selected, side) {
 const region=muscles.find(m=>m.id===selected);
 return meshes.filter(m=>m.userData.group===selected && m.userData.side===side && (!region.massageMatch || region.massageMatch.test(m.userData.name)));
}
export function massageAnchor(meshes, selected, selectedSide) {
      const muscle = muscles.find((m) => m.id === selected);
      const chosen = meshes.filter(
        (m) =>
          m.userData.group === selected && m.userData.side === selectedSide && (!muscle.massageMatch || muscle.massageMatch.test(m.userData.name)),
      );
      const box = new THREE.Box3();
      chosen.forEach((m) => box.expandByObject(m));
      const sign = selectedSide === "left" ? 1 : -1;
      const normal =
        ["outerthigh", "outercalf"].includes(selected)
          ? new THREE.Vector3(sign * 0.8, 0, selected === "outerthigh" ? 0.6 : 0.15).normalize()
          : selected === "adductors"
          ? new THREE.Vector3(-sign * 0.8, 0, 0.6)
          : new THREE.Vector3(
              selected === "shins" ? sign * 0.3 : 0,
              0,
              muscle.view === "back" ? -1 : 1,
            ).normalize();
      const point = new THREE.Vector3(
        sign * Math.abs(muscle.point[0]),
        muscle.point[1],
        muscle.point[2],
      );
      if (!box.isEmpty()) {
        point.y = THREE.MathUtils.clamp(
          point.y,
          box.min.y + 0.02,
          box.max.y - 0.02,
        );
      }
      const surfaceRay = new THREE.Raycaster(
        point.clone().addScaledVector(normal, 0.6),
        normal.clone().negate(),
      );
      let hit = surfaceRay.intersectObjects(chosen)[0];
      if (!hit && !box.isEmpty()) {
        box.getCenter(point);
        point.y = THREE.MathUtils.clamp(
          muscle.point[1],
          box.min.y + 0.02,
          box.max.y - 0.02,
        );
        surfaceRay.set(
          point.clone().addScaledVector(normal, 0.6),
          normal.clone().negate(),
        );
        hit = surfaceRay.intersectObjects(chosen)[0];
      }
      if (!meshes.length) return {point,normal,size:new THREE.Vector3(.16,.4,.12)};
      if (!hit) throw new Error(`No muscle surface at ${selected}/${selectedSide}`);
      point.copy(hit.point);
      const result = {
        point,
        normal,
        size: box.isEmpty()
          ? new THREE.Vector3(0.16, 0.4, 0.12)
          : box.getSize(new THREE.Vector3()),
      };

 return result;
}

export function sampleMassagePath(anchor, chosen, technique, travel, side) {
 const samples=[], normals=[], names=[];
 const tangent=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),anchor.normal).normalize();
 if(side==="left") tangent.negate();
 for(let i=0;i<=40;i++){
  const u=i/40,point=anchor.point.clone();
  point.y+=technique==="circle"?Math.sin(u*Math.PI*2)*travel*.3:-travel/2+travel*u;
  if(technique==="circle") point.addScaledVector(tangent,(Math.cos(u*Math.PI*2)-1)*travel*.23);
  const ray=new THREE.Raycaster(point.clone().addScaledVector(anchor.normal,.2),anchor.normal.clone().negate());
  const hit=ray.intersectObjects(chosen)[0];
  if(!hit) throw new Error(`Massage path misses muscle at sample ${i}`);
  samples.push(hit.point.clone());names.push(hit.object.userData.name);
  const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
  if(normal.dot(anchor.normal)<0) normal.negate();
  normals.push(normal);
 }
 return {samples,normals,names};
}
