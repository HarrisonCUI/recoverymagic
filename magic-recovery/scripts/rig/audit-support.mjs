import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const bytes=fs.readFileSync('public/models/rigged/atlas-recovery.glb');
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const meshes=[];gltf.scene.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});
const body=meshes.find(m=>m.name.startsWith('Atlas_Body')),cloth=meshes.find(m=>m!==body),bones=body.skeleton.bones;
const mixer=new T.AnimationMixer(gltf.scene),a=body.geometry.attributes;
const native=(i)=>({x:a.uv.getX(i),y:1-a.uv.getY(i)});
function triangles(mesh,points,predicate=()=>true){const ids=mesh.geometry.index.array,out=[];for(let i=0;i<ids.length;i+=3){const vs=[ids[i],ids[i+1],ids[i+2]];if(vs.every(predicate)){const tri=new T.Triangle(...vs.map(i=>points[i]));out.push({tri,box:new T.Box3().setFromPoints([tri.a,tri.b,tri.c]),normal:tri.getNormal(new T.Vector3()),bindZ:mesh.geometry.attributes.normal?vs.reduce((sum,i)=>sum+mesh.geometry.attributes.normal.getZ(i),0)/3:0});}}return out;}
function nearest(point,faces){let d=Infinity,signed=Infinity,bindZ=0;const q=new T.Vector3();for(const f of faces){if(f.box.distanceToPoint(point)>d)continue;f.tri.closestPointToPoint(point,q);const dd=point.distanceTo(q);if(dd<d){d=dd;bindZ=f.bindZ;signed=point.clone().sub(q).dot(f.normal);}}return {d,signed,bindZ};}
function spreadArea(samples){const n=samples.length,mean=samples.reduce((s,p)=>[s[0]+p[0]/n,s[1]+p[1]/n],[0,0]);let xx=0,yy=0,xy=0;for(const [x,y] of samples){xx+=(x-mean[0])**2/n;yy+=(y-mean[1])**2/n;xy+=(x-mean[0])*(y-mean[1])/n;}return Math.sqrt(Math.max(0,xx*yy-xy*xy));}
function intersections(first,second){let count=0;const ray=new T.Ray(),hit=new T.Vector3();for(const x of first)for(const y of second){if(!x.box.intersectsBox(y.box))continue;let crossing=false;for(const [aa,bb] of [[x,y],[y,x]]){const p=[aa.tri.a,aa.tri.b,aa.tri.c];for(let i=0;i<3;i++){const end=p[(i+1)%3],length=p[i].distanceTo(end);ray.set(p[i],end.clone().sub(p[i]).normalize());if(ray.intersectTriangle(bb.tri.a,bb.tri.b,bb.tri.c,false,hit)&&hit.distanceTo(p[i])<length-1e-5&&hit.distanceTo(p[i])>1e-5){crossing=true;break;}}if(crossing)break;}if(crossing)count++;}return count;}
const errors=[],samples=[];function require(ok,message){if(!ok)errors.push(message);}
const phases=process.argv.includes('--quick')?[0,3]:Array.from({length:13},(_,i)=>i*.5);
for(const side of ['left','right']){
 mixer.stopAllAction();mixer.clipAction(gltf.animations.find(c=>c.name===`supine-${side}`)).play();
 for(const phase of phases){
  mixer.setTime(Math.min(phase,5.9999));gltf.scene.updateMatrixWorld(true);meshes.forEach(m=>m.skeleton.update());
  const positions=m=>Array.from({length:m.geometry.attributes.position.count},(_,i)=>m.getVertexPosition(i,new T.Vector3()).applyMatrix4(m.matrixWorld));
  const p=positions(body),c=positions(cloth),sign=side==='left'?1:-1,label=`${side}@${phase}`;
  const joint=(name,suffix=sign===1?'L':'R')=>bones.find(b=>b.name.replace('.','')===name+suffix).getWorldPosition(new T.Vector3());
  const hip=joint('thigh'),knee=joint('shin'),ankle=joint('foot'),axis=knee.clone().sub(hip).normalize();
  const kneeAngle=knee.clone().sub(hip).negate().angleTo(ankle.clone().sub(knee))*180/Math.PI;
  require(kneeAngle>45&&kneeAngle<150,`${label}: folded or hyperextended knee (${kneeAngle})`);
  const thigh=triangles(body,p,i=>{const v=native(i);return sign*v.x>.02&&sign*v.x<.20&&v.y>.50&&v.y<.84;});
  const shorts=triangles(cloth,c),otherLeg=triangles(body,p,i=>{const v=native(i);return -sign*v.x>.02&&-sign*v.x<.20&&v.y<.84;});
  const activeLowerLeg=triangles(body,p,i=>{const v=native(i);return sign*v.x>.02&&sign*v.x<.20&&v.y<.50;});
  const footVertex=i=>{const v=native(i);return sign*v.x>.02&&sign*v.x<.20&&v.y<.14;};
  const footTris=triangles(body,p,footVertex);const footPoints=p.filter((_,i)=>footVertex(i));
  const footShortsDistance=Math.min(...footPoints.map(v=>nearest(v,shorts).d));
  const footLegDistance=Math.min(...footPoints.map(v=>nearest(v,otherLeg).d));
  const footThighDistance=Math.min(...footPoints.map(v=>nearest(v,thigh).d));
  require(footShortsDistance>.03,`${label}: foot near shorts (${footShortsDistance})`);
  require(footLegDistance>.02,`${label}: foot near other leg (${footLegDistance})`);
  require(footThighDistance>.02,`${label}: foot folded into supported thigh (${footThighDistance})`);
  require(intersections(footTris,shorts)===0,`${label}: foot intersects shorts`);
  require(intersections(footTris,otherLeg)===0,`${label}: foot intersects other leg`);
  require(intersections(footTris,thigh)===0,`${label}: foot intersects supported thigh`);
  const handInfo=[],handTris=[];
  for(const hs of [1,-1]){
   const suffix=hs===1?'L':'R',elbow=joint('forearm',suffix),wrist=joint('hand',suffix),knuckle=joint('middle1',suffix);
   const wristDegrees=wrist.clone().sub(elbow).angleTo(knuckle.clone().sub(wrist))*180/Math.PI;
   require(wristDegrees<55,`${label}/${suffix}: wrist bends sharply (${wristDegrees})`);
   const longitudinal=wrist.clone().sub(elbow).normalize(),u=new T.Vector3(0,1,0).cross(longitudinal).normalize(),v=longitudinal.clone().cross(u).normalize(),bindSection=[],posedSection=[];
   for(let i=0;i<p.length;i++){const pt=native(i);if(hs*pt.x>.205&&pt.y>.882&&pt.y<.900){bindSection.push([a.position.getX(i),a.position.getZ(i)]);posedSection.push([p[i].dot(u),p[i].dot(v)]);}}
   const wristAreaRatio=spreadArea(posedSection)/spreadArea(bindSection);
   require(wristAreaRatio>.30,`${label}/${suffix}: wrist skin collapses (${wristAreaRatio})`);
   const palm=[],facing=[],whole=[],handVertex=i=>{const v=native(i);return hs*v.x>.205&&v.y<.88;};
   handTris.push(triangles(body,p,handVertex));
   for(let i=0;i<p.length;i++){
    if(!handVertex(i))continue;const v=native(i),n=nearest(p[i],thigh);whole.push(n);
    if(v.y>.84&&v.y<.879&&Math.abs(v.x)<.305&&a.normal.getZ(i)>.5)palm.push(n.d);
   }
   const patch=triangles(body,p,i=>{const v=native(i);return handVertex(i)&&v.y>.84&&v.y<.879&&Math.abs(v.x)<.305&&a.normal.getZ(i)>.5;});
   for(const f of patch){const center=f.tri.getMidpoint(new T.Vector3());const onAxis=hip.clone().addScaledVector(axis,center.clone().sub(hip).dot(axis));facing.push(f.normal.dot(onAxis.sub(center).normalize()));}
   palm.sort((a,b)=>a-b);
   // A closest point on an open patch boundary is not an inside/outside
   // classification. Use near-normal projections for depth, plus exact
   // triangle crossings below; this avoids false depth at the kneecap edge.
   const info={side:hs===1?'L':'R',wristDegrees,wristAreaRatio,closest:Math.min(...whole.map(v=>v.d)),palmMedian:palm[Math.floor(palm.length/2)],palmClose:palm.filter(d=>d<.02).length,posteriorContacts:whole.filter(v=>v.d<.015&&v.bindZ<-.25).length,palmFacing:facing.reduce((sum,d)=>sum+d,0)/facing.length,depth:Math.min(...whole.filter(v=>v.d<.05&&Math.abs(v.signed)>.9*v.d).map(v=>v.signed))};
   require(info.depth>-.0015,`${label}/${info.side}: hand penetrates thigh (${info.depth})`);
   require(info.closest<.008,`${label}/${info.side}: no hand contact (${info.closest})`);
   require(info.palmMedian<.035&&info.palmClose>=5,`${label}/${info.side}: palm floats (${info.palmMedian}, ${info.palmClose} close vertices)`);
   require(info.posteriorContacts>=8,`${label}/${info.side}: support does not contact anatomical posterior thigh (${info.posteriorContacts})`);
   require(info.palmFacing>.55,`${label}/${info.side}: palm faces away (${info.palmFacing})`);
   require(intersections(handTris.at(-1),thigh)===0,`${label}/${info.side}: hand triangles cross thigh`);
   require(intersections(handTris.at(-1),shorts)===0,`${label}/${info.side}: hand crosses shorts`);
   require(intersections(handTris.at(-1),activeLowerLeg)===0,`${label}/${info.side}: fingers cross the moving calf/foot`);
   require(intersections(handTris.at(-1),otherLeg)===0,`${label}/${info.side}: fingers cross the resting leg`);
   handInfo.push(info);
  }
  require(intersections(...handTris)===0,`${label}: hands intersect`);
  samples.push({side,phase,kneeAngle,footShortsDistance,footLegDistance,footThighDistance,hands:handInfo});
 }
}
const report={samples,errors:[...new Set(errors)]};fs.mkdirSync('qa/whole-pose',{recursive:true});fs.writeFileSync('qa/whole-pose/surface-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({phases:samples.length,kneeDegrees:[Math.min(...samples.map(s=>s.kneeAngle)),Math.max(...samples.map(s=>s.kneeAngle))],minFootShorts:Math.min(...samples.map(s=>s.footShortsDistance)),minFootOtherLeg:Math.min(...samples.map(s=>s.footLegDistance)),hands:samples.filter(s=>s.phase===0).map(s=>({side:s.side,hands:s.hands})),errors:report.errors},null,2));
if(errors.length)process.exitCode=1;
