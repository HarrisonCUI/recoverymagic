import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {RIG_VERSION} from './rigVersion.js';
import {MOTIONS} from './motions.js';
import {loadBufferAsset} from './assetLoader.js';
let asset;
function load(){
  if(!asset) {
    if (__MINITOOL_BUILD__) {
      asset=loadBufferAsset('rigBuffer','/models/rigged/atlas-recovery.glb').then(bytes=>new GLTFLoader().parseAsync(bytes,'')).catch(e=>{asset=null;throw e;});
    } else {
      asset=new GLTFLoader().loadAsync(`/models/rigged/atlas-recovery.glb?v=${RIG_VERSION}`).catch(e=>{asset=null;throw e;});
    }
  }
  return asset;
}
// The full-body viewer plays exported skeletal animations. It never modifies
// body vertices or invents a different skeleton for each tutorial pose.
export async function createBoundAtlasRig(scene,selected,side,isDisposed=()=>false,poseSource){
 const gltf=await load();if(isDisposed())return null;
 const root=clone(gltf.scene),supine=Boolean(poseSource?.(selected,0,side).supine);
 root.name='Atlas rebound teaching character';
 root.traverse(o=>{
  if(!o.isMesh)return;
  // Own resources per scene so disposal cannot invalidate cached assets.
  o.geometry=o.geometry.clone();o.material=o.material.clone();o.frustumCulled=false;
  if(o.name.startsWith('Atlas_Body')){
   const uv=o.geometry.attributes.uv, colors=new Float32Array(o.geometry.attributes.position.count*3);
   const base=new THREE.Color(0xabb9bb),accent=new THREE.Color(0xf29b67);
   const [lo,hi]={quads:[.49,.80],hamstrings:[.49,.80],adductors:[.53,.79],calves:[.18,.41],shins:[.16,.40],outerthigh:[.49,.80],outercalf:[.16,.40]}[selected];
   for(let i=0;i<colors.length/3;i++){
    const x=uv.getX(i),y=1-uv.getY(i);const onSide=Math.abs(x)<.20 && (side==='left'?x>0:x<0);
    const band=THREE.MathUtils.smoothstep(y,lo,lo+.04)*(1-THREE.MathUtils.smoothstep(y,hi-.04,hi));
    const z=o.geometry.attributes.position.getZ(i);
    const facing=['outerthigh','outercalf'].includes(selected)?THREE.MathUtils.smoothstep(Math.abs(x),.10,.145):['hamstrings','calves'].includes(selected)?1-THREE.MathUtils.smoothstep(z,-.06,.01):selected==='adductors'?1-THREE.MathUtils.smoothstep(Math.abs(x),.035,.10):THREE.MathUtils.smoothstep(z,-.015,.04);
    base.clone().lerp(accent,onSide?band*facing*.6:0).toArray(colors,i*3);
   }
   o.geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));o.material.color.set(0xffffff);o.material.vertexColors=true;
  }
 });
 scene.add(root);
 const clipName=`${supine?'supine':MOTIONS[selected]?.clipRegion||selected}-${side}`;
 const clip=gltf.animations.find(c=>c.name===clipName);
 if(!clip)throw new Error('Missing bound animation: '+clipName);
 const mixer=new THREE.AnimationMixer(root);mixer.clipAction(clip).play();
 function update(seconds){mixer.setTime(Math.max(0,seconds)%clip.duration);root.updateMatrixWorld(true);}
 update(0);
 return {update,root,clip,dispose(){mixer.stopAllAction();mixer.uncacheRoot(root);root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();});}};
}
