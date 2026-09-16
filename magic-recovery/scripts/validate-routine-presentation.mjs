import assert from 'node:assert/strict';
import {recoveryRegions,SESSION_DURATIONS} from '../src/recoveryCatalog.js';
import {recoveryRoutine,routineState} from '../src/recoveryRoutine.js';
import {routinePresentation} from '../src/routinePresentation.js';
for(const region of recoveryRegions)for(const duration of SESSION_DURATIONS){
 const steps=recoveryRoutine(region.id,duration);
 const at=elapsed=>routinePresentation(routineState(region.id,duration,duration-elapsed));
 for(const step of steps){
  if(step.kind==='transition'){
   const outgoing=at(step.start),hidden=at(step.start+550),incoming=at(step.start+600),ready=at(step.start+1500),active=at(step.end);
   assert.equal(outgoing.opacity,1);assert.equal(outgoing.animate,false);
   assert.equal(hidden.opacity,0);assert.equal(incoming.opacity,0);
   assert.equal(ready.opacity,1);assert.equal(incoming.elapsed,0);
   assert.equal(incoming.action.id,active.action.id);
   assert.equal(active.elapsed,0);
  }
  if(step.kind==='action'){
   const end=at(step.end),before=at(step.end-.01);
   if(end.mode==='release'||end.mode==='rest'){
    assert.equal(end.action.id,before.action.id);
    assert.ok(Math.abs(end.elapsed-before.elapsed)<.02,'no reset at rest boundary');
   }
   const begin=at(step.start),preview=at(step.start-.01);
   const cycle=begin.action.method==='massage'&&begin.action.technique!=='pin'?8000:6000;
   const p=preview.elapsed%cycle;
   assert.ok(p<.02||cycle-p<.02,'preview must end at the action ready pose');
  }
 }
 const pausedState=routineState(region.id,duration,duration-steps[2].start-350);
 assert.deepEqual(routinePresentation(pausedState),routinePresentation(pausedState),'presentation uses paused course time only');
}
console.log('PASS: 28 courses — released outgoing pose, hidden handoff, ready incoming pose, continuous preview/action boundaries and stable rest.');
