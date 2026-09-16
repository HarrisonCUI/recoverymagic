import * as THREE from 'three';
const V = a => new THREE.Vector3(...a);
const Y = new THREE.Vector3(0,1,0);
const digits = ['pinky','ring','middle','index','thumb'];
// Pose-space skin correction. Keep the actual distal pads fixed; relax stretched
// web edges, never move fingers by independent object transforms.
export function correctHandSurface(rig, surface) {
  const {asset,mesh}=rig;
  if (!rig.edges) {
    const seen=new Set();rig.edges=[];rig.neighbors=asset.positions.filter((_,i)=>i%3===0).map(()=>new Set());
    for(let k=0;k<asset.indices.length;k+=3) for(let j=0;j<3;j++) {
      const a=asset.indices[k+j],b=asset.indices[k+(j+1)%3],key=Math.min(a,b)+':'+Math.max(a,b);
      if(seen.has(key))continue;seen.add(key);
      rig.edges.push([a,b,V(asset.positions.slice(a*3,a*3+3)).distanceTo(V(asset.positions.slice(b*3,b*3+3)))]);
      rig.neighbors[a].add(b);rig.neighbors[b].add(a);
    }
    rig.fixed=new Set(Object.values(asset.pads).flat());
  }
  const points=Array.from({length:asset.positions.length/3},(_,i)=>mesh.applyBoneTransform(i,V(asset.positions.slice(i*3,i*3+3))));
  const delta=new THREE.Vector3();
  for(let iteration=0;iteration<24;iteration++) {
    for(const [a,b,rest] of rig.edges) {
      delta.copy(points[b]).sub(points[a]);const length=delta.length(),limit=rest*1.65;
      if(length<=limit)continue;
      const wa=rig.fixed.has(a)?0:1,wb=rig.fixed.has(b)?0:1;if(!wa&&!wb)continue;
      delta.multiplyScalar((length-limit)/length/(wa+wb)*.65);
      points[a].addScaledVector(delta,wa);points[b].addScaledVector(delta,-wb);
    }
    for(let i=0;i<points.length;i++) {
      const gap=surface.clearance(points[i]);if(gap<.0004 && !rig.fixed.has(i))points[i].addScaledVector(surface.normal(points[i]),.0004-gap);
    }
  }
  return Float32Array.from(points.flatMap(p=>p.toArray()));
}

// Cache corrected poses for cheap deterministic playback, including course pause
// and resume. The skeleton solves each pose; only the web skin has a corrective.
export function createMassagePlayback(rig,surface,technique) {
  const frames=[],count=64;
  for(let i=0;i<=count;i++){rig.pose(surface,technique,i*8/count);frames.push(correctHandSurface(rig,surface));}
  const geometry=rig.mesh.geometry.clone();geometry.deleteAttribute('skinIndex');geometry.deleteAttribute('skinWeight');
  const mesh=new THREE.Mesh(geometry,rig.mesh.material.clone());mesh.frustumCulled=false;
  const colors=new Float32Array(rig.asset.positions.length).fill(1);
  for(const d of technique==='thumb'?['thumb']:digits) for(const i of rig.asset.pads[d])colors.set([1,.52,.25],i*3);
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));mesh.material.vertexColors=true;
  const pad=d=>{const p=new THREE.Vector3(),a=geometry.attributes.position;for(const i of rig.asset.pads[d])p.add(new THREE.Vector3().fromBufferAttribute(a,i));return p.divideScalar(rig.asset.pads[d].length);};
  const update=seconds=>{const at=((seconds%8+8)%8)/8*count,i=Math.floor(at),t=at-i,a=geometry.attributes.position;
    for(let k=0;k<a.array.length;k++)a.array[k]=THREE.MathUtils.lerp(frames[i][k],frames[i+1][k],t);
    a.needsUpdate=true;geometry.computeVertexNormals();
  };
  update(0);return {mesh,update,pad,frames,surface};
}
export function buildMassageHand(asset) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(asset.positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(asset.normals,3));
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(asset.skinIndices,4));
  geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(asset.skinWeights,4));
  geometry.setIndex(asset.indices);
  const bones=asset.bones.map(spec=>{const b=new THREE.Bone();b.name=spec.name;b.position.fromArray(spec.position);b.quaternion.fromArray(spec.quaternion);return b;});
  const mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshStandardMaterial({color:0xbbc9ce,metalness:.12,roughness:.62}));
  bones.forEach((bone,i)=>{const parent=asset.bones[i].parent; (parent<0?mesh:bones[parent]).add(bone);});
  mesh.bind(new THREE.Skeleton(bones));mesh.frustumCulled=false;
  const byName=Object.fromEntries(bones.map(b=>[b.name,b]));
  const reset=()=>{bones.forEach((b,i)=>{b.position.fromArray(asset.bones[i].position);b.quaternion.fromArray(asset.bones[i].quaternion);});mesh.updateMatrixWorld(true);};
  const pad = digit => {mesh.updateMatrixWorld(true);mesh.skeleton.update();const p=new THREE.Vector3(); for(const index of asset.pads[digit]) p.add(mesh.applyBoneTransform(index,V(asset.positions.slice(index*3,index*3+3))));return p.divideScalar(asset.pads[digit].length);};
  function orient(bone,direction,normal) {
    const z=normal.clone().addScaledVector(direction,-normal.dot(direction)).normalize();
    const x=new THREE.Vector3().crossVectors(direction,z).normalize();
    const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,direction,z));
    const parent=bone.parent.getWorldQuaternion(new THREE.Quaternion());
    bone.quaternion.copy(parent.invert().multiply(q));mesh.updateMatrixWorld(true);
  }
  function finger(digit,target,normalAt) {
    const bs=[1,2,3].map(k=>byName[digit+k]);
    const lengths=asset.chains[digit].slice(0,3).map((p,i)=>V(p).distanceTo(V(asset.chains[digit][i+1])));
    const root=bs[0].getWorldPosition(new THREE.Vector3());
    // Solve in mesh coordinates (the rig itself remains identity; its container is placed in scene).
    let endpoint=target.clone();
    for(let correction=0;correction<4;correction++) {
      const points=[root.clone()];
      for(let i=0;i<3;i++) {
        const t=(i+1)/3;
        points.push(root.clone().lerp(endpoint,t).addScaledVector(normalAt(root.clone().lerp(endpoint,t)),Math.sin(t*Math.PI)*.018));
      }
      for(let iteration=0;iteration<12;iteration++) {
        points[3].copy(endpoint);
        for(let i=2;i>=0;i--) points[i].copy(points[i+1].clone().add(points[i].clone().sub(points[i+1]).normalize().multiplyScalar(lengths[i])));
        points[0].copy(root);
        for(let i=0;i<3;i++) points[i+1].copy(points[i].clone().add(points[i+1].clone().sub(points[i]).normalize().multiplyScalar(lengths[i])));
      }
      for(let i=0;i<3;i++) orient(bs[i],points[i+1].clone().sub(points[i]).normalize(),normalAt(points[i]));
      const error=target.clone().sub(pad(digit));
      endpoint.add(error.multiplyScalar(.9));
    }
  }
  function pose(surface, technique, seconds) {
    reset();
    const t=((seconds%8)+8)%8, u=THREE.MathUtils.clamp((t-1.5)/4.5,0,1), squeeze=Math.sin(Math.PI*u)**2;
    const hover=t<1.5 ? .045*(1-THREE.MathUtils.smoothstep(t,0,1.5)) : t>6 ? .045*THREE.MathUtils.smoothstep(t,6,8) : 0;
    byName.palm.position.z += .021 + hover;
    mesh.updateMatrixWorld(true);
    const normalAt=p=>surface.normal(p);
    // Fingers wrap one side; thumb opposes from the other. Target the actual source pad patches.
    for (const digit of digits) {
      const root=V(asset.chains[digit][0]), thumb=digit==='thumb';
      const angle=thumb ? -(technique==='thumb' ? .64 : .74+.10*squeeze) : (technique==='thumb' ? .93 : .91+.12*squeeze);
      const axial=thumb ? .034 : root.x + (digit==='pinky' ? -.008 : digit==='ring' ? -.001 : 0);
      const gap=technique==='thumb' ? (thumb ? .003+.0025*(1-squeeze) : .0025) : .0025+.003*(1-squeeze);
      const target=surface.point(axial,angle,gap+hover);
      finger(digit,target,normalAt);
    }
    mesh.skeleton.update();return {hover,squeeze};
  }
  return {mesh,asset,bones,byName,reset,pad,pose};
}

// A sampled radial envelope of the displayed calf, in the hand's local grip frame.
export function createCalfSurface(meshes, anchor, side) {
  const box=new THREE.Box3();meshes.forEach(m=>box.expandByObject(m));
  const center=box.getCenter(new THREE.Vector3());center.y=anchor.point.y;
  const outward=anchor.normal.clone();outward.y=0;outward.normalize();
  const axial=Y.clone(), tangent=new THREE.Vector3().crossVectors(outward,axial).normalize();
  // Negative local angle is the thumb side: keep it medial on either leg.
  if(side==='right') tangent.negate();
  const nAngles=80,nRows=25,height=.15,radii=[];
  const ray=new THREE.Raycaster();
  for(let row=0;row<nRows;row++) {
    const x=(row/(nRows-1)-.5)*height,origin=center.clone().addScaledVector(axial,x);
    const values=[];
    for(let i=0;i<nAngles;i++) {
      const a=(i/nAngles-.5)*Math.PI*2,direction=outward.clone().multiplyScalar(Math.cos(a)).addScaledVector(tangent,Math.sin(a));
      ray.set(origin.clone().addScaledVector(direction,.25),direction.clone().negate());
      const hit=ray.intersectObjects(meshes)[0];
      values.push(hit ? hit.point.clone().sub(origin).dot(direction) : 0);
    }
    radii.push(values);
  }
  function radius(x,angle) {
    const row=THREE.MathUtils.clamp((x/height+.5)*(nRows-1),0,nRows-1),a=(((angle/(Math.PI*2)+.5)%1)+1)%1*nAngles;
    const r0=Math.floor(row),r1=Math.min(nRows-1,r0+1),i=Math.floor(a)%nAngles,j=(i+1)%nAngles;
    return THREE.MathUtils.lerp(THREE.MathUtils.lerp(radii[r0][i],radii[r0][j],a-Math.floor(a)),THREE.MathUtils.lerp(radii[r1][i],radii[r1][j],a-Math.floor(a)),row-r0);
  }
  const r=radius(0,0),cy=-.099,cz=.015-r;
  const point=(x,angle,gap=0)=>new THREE.Vector3(x,cy+(radius(x,angle)+gap)*Math.sin(angle),cz+(radius(x,angle)+gap)*Math.cos(angle));
  const normal=p=>new THREE.Vector3(0,p.y-cy,p.z-cz).normalize();
  const clearance=p=>Math.hypot(p.y-cy,p.z-cz)-radius(p.x,Math.atan2(p.y-cy,p.z-cz));
  const origin=center.clone().addScaledVector(tangent,-cy).addScaledVector(outward,-cz);
  const matrix=new THREE.Matrix4().makeBasis(axial,tangent,outward);matrix.setPosition(origin);
  return {point,normal,clearance,radius,radii,matrix,center,origin,axial,tangent,outward,r,cy,cz};
}
