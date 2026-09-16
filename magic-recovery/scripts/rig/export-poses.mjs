import fs from 'node:fs';
import {movementPose} from '../../src/motions.js';
import {supineMassagePose} from '../../src/massagePose.js';
const clips=[];
for(const side of ['left','right'])for(const region of ['quads','hamstrings','adductors','calves','shins','supine']){
 const fn=region==='supine'?supineMassagePose:movementPose;
 clips.push({name:`${region}-${side}`,side,region,frames:Array.from({length:73},(_,i)=>fn(region==='supine'?'hamstrings':region,i/12,side))});
}
fs.writeFileSync('scripts/rig/poses.json',JSON.stringify(clips));
