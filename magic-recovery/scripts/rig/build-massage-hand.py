"""Bind the original isolated Atlas hand to palm + 15 independent phalanges.
Authoring output is separate from the legacy touch hand and full-body rig.
"""
import bpy, json, pathlib, math, struct, hashlib
from mathutils import Vector, Matrix
ROOT=pathlib.Path(__file__).resolve().parents[2]
asset=json.loads((ROOT/'public/models/hand.json').read_text())
# Recover the extractor's affine translation using the same clipped source surface.
meta=json.loads((ROOT/'public/models/movement.json').read_text()); part=next(p for p in meta['parts'] if p['name']=='Skin'); data=(ROOT/'public/models/movement.bin').read_bytes()
pts=[struct.unpack_from('<fff',data,part['positions']+i*12) for i in range(part['vertexCount'])]
ii=struct.unpack_from('<'+'I'*part['indexCount'],data,part['indices']); selected=[]
for i in range(0,len(ii),3):
 ids=ii[i:i+3]
 if not all(pts[k][0]>.20 for k in ids):continue
 poly=[pts[k] for k in ids]
 for a,b in zip(poly,poly[1:]+poly[:1]):
  if a[1]<=.925:selected.append(a)
  if (a[1]<=.925)!=(b[1]<=.925):
   t=(.925-a[1])/(b[1]-a[1]);selected.append(tuple(a[k]+t*(b[k]-a[k]) for k in range(3)))
c=math.cos(math.radians(23));s=math.sin(math.radians(23))
def rotated(p):return (p[0],-c*p[1]+s*p[2],-s*p[1]-c*p[2])
raw=[rotated(p) for p in selected];xc=(min(p[0] for p in raw)+max(p[0] for p in raw))/2;ym=max(p[1] for p in raw);zm=min(p[2] for p in raw)
def P(p):
 x,y,z=rotated(p);return Vector(((x-xc)*.72,(y-ym)*.72,(z-zm)*.72+.001))
chains={'pinky':[(.224,.818,.032),(.222,.777,.058),(.222,.758,.077),(.222,.753,.088)],'ring':[(.247,.829,.025),(.247,.780,.047),(.247,.749,.078),(.247,.741,.1)],'middle':[(.273,.837,.020),(.273,.783,.040),(.275,.740,.073),(.274,.729,.098)],'index':[(.298,.837,.026),(.302,.784,.035),(.307,.751,.067),(.307,.739,.090)],'thumb':[(.297,.866,.030),(.315,.841,.039),(.324,.818,.065),(.325,.798,.078)]}
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
with bpy.data.libraries.load(str(ROOT/'assets/rig/atlas-bound.blend'),link=False) as (source,target):
 target.objects=[name for name in source.objects if name=='Atlas_Bind_Surface']
bound=target.objects[0]
if bound is None:raise RuntimeError('Source bind surface is missing')
source=[]
for v in bound.data.vertices:
 native=(v.co.x,v.co.z,-v.co.y);weights={}
 for g in v.groups:
  name=bound.vertex_groups[g.group].name
  if not name.endswith('.L'):continue
  name=name[:-2]
  if name=='hand' or name.startswith('forearm'):name='palm'
  if name!='palm' and not any(name.startswith(digit) for digit in chains):continue
  weights[name]=weights.get(name,0)+g.weight
 source.append((native,weights))
vs=[];faces=[];vertexWeights=[];lookup={};boundary={}
def add(point,weights):
 key=tuple(round(x,7) for x in point)
 if key not in lookup:
  lookup[key]=len(vs);vs.append(list(P(point)));vertexWeights.append(weights)
 return lookup[key]
for face in bound.data.polygons:
 poly=[source[i] for i in face.vertices]
 if not all(v[0][0]>.20 for v in poly):continue
 out=[]
 for (a,wa),(b,wb) in zip(poly,poly[1:]+poly[:1]):
  if a[1]<=.925:out.append((a,wa))
  if (a[1]<=.925)!=(b[1]<=.925):
   t=(.925-a[1])/(b[1]-a[1]);point=tuple(a[k]+t*(b[k]-a[k]) for k in range(3));weights={name:(1-t)*wa.get(name,0)+t*wb.get(name,0) for name in set(wa)|set(wb)};out.append((point,weights));boundary[tuple(round(x,7) for x in point)]=point
 if len(out)<3:continue
 ids=[add(*v) for v in out]
 for k in range(1,len(ids)-1):faces.append((ids[0],ids[k],ids[k+1]))
ring=list(boundary.values());center=tuple(sum(v[k] for v in ring)/len(ring) for k in range(3));ring.sort(key=lambda v:math.atan2(v[2]-center[2],v[0]-center[0]),reverse=True)
centerIndex=add(center,{'palm':1})
for i in range(len(ring)):faces.append((centerIndex,add(ring[i],{'palm':1}),add(ring[(i+1)%len(ring)],{'palm':1})))
bpy.data.objects.remove(bound,do_unlink=True)
mesh=bpy.data.meshes.new('Atlas isolated bound hand');mesh.from_pydata(vs,[],faces);mesh.update()
body=bpy.data.objects.new('Atlas_Massage_Hand',mesh);bpy.context.collection.objects.link(body)
asset={**asset,'positions':[round(x,7) for v in vs for x in v],'normals':[round(x,7) for v in mesh.vertices for x in v.normal],'indices':[i for face in faces for i in face]}
armdata=bpy.data.armatures.new('MassageHandSkeleton');arm=bpy.data.objects.new('MassageHandSkeleton',armdata);bpy.context.collection.objects.link(arm);bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
b=armdata.edit_bones.new('palm');b.head=P((.265,.89,.005));b.tail=P((.272,.834,.025));names=['palm']
for digit,points in chains.items():
 for k in range(3):
  name=f'{digit}{k+1}';names.append(name);b=armdata.edit_bones.new(name);b.head=P(points[k]);b.tail=P(points[k+1]);b.parent=armdata.edit_bones['palm' if k==0 else f'{digit}{k}']
  b.use_connect=k>0;b.align_roll(Vector((0,0,1)))
bpy.ops.object.mode_set(mode='OBJECT')
# Smooth only along connected skin edges to remove discontinuous finger-family
# boundaries at the webbing. Keep distal pad patches and wrist as anchors.
neighbors=[set() for _ in vs]
for face in faces:
 for i,j in zip(face,face[1:]+face[:1]):neighbors[i].add(j);neighbors[j].add(i)
for iteration in range(18):
 updated=[]
 for i,(pos,weights) in enumerate(zip(vs,vertexWeights)):
  x,y,z=pos
  fixed=y<-.13 or y>-.027 or (x>.028 and y>-.077)
  if fixed or not neighbors[i]:updated.append(weights);continue
  averaged={}
  for j in neighbors[i]:
   for name,w in vertexWeights[j].items():averaged[name]=averaged.get(name,0)+w/len(neighbors[i])
  updated.append({name:.3*weights.get(name,0)+.7*averaged.get(name,0) for name in set(weights)|set(averaged)})
 vertexWeights=updated
# Copy source weights with webbing transition correction and wrist interpolation.
for name in names:body.vertex_groups.new(name=name)
for v,weights in zip(body.data.vertices,vertexWeights):
 total=sum(weights.values())
 if total<1e-6:raise RuntimeError(f'Unbound source vertex {v.index}')
 for name,w in weights.items():body.vertex_groups[name].add([v.index],w/total,'REPLACE')
modifier=body.modifiers.new('Massage hand skin','ARMATURE');modifier.object=arm;body.parent=arm
bpy.context.view_layer.objects.active=body;body.select_set(True)
bpy.ops.object.vertex_group_limit_total(limit=4);bpy.ops.object.vertex_group_normalize_all(lock_active=False)
indices=[];weights=[]
for v in body.data.vertices:
 w=sorted([(names.index(body.vertex_groups[g.group].name),g.weight) for g in v.groups if g.weight>1e-7],key=lambda p:-p[1])[:4];total=sum(t[1] for t in w)
 indices.extend([t[0] for t in w]+[0]*(4-len(w)));weights.extend([round(t[1]/total,8) for t in w]+[0]*(4-len(w)))
bones=[]
for name in names:
 b=arm.data.bones[name];local=b.parent.matrix_local.inverted()@b.matrix_local if b.parent else b.matrix_local
 pos,q,sc=local.decompose();bones.append({'name':name,'parent':names.index(b.parent.name) if b.parent else -1,'position':list(pos),'quaternion':[q.x,q.y,q.z,q.w],'head':list(b.head_local),'tail':list(b.tail_local)})
# Surface pad landmarks are actual source vertices nearest the distal palmar face.
pads={}
for digit,points in chains.items():
 target=P(points[-1]);boneIdx=[names.index(f'{digit}{k}') for k in [2,3]]
 choices=[v for v in body.data.vertices if sum(weights[v.index*4+k] for k in range(4) if indices[v.index*4+k] in boneIdx)>.65]
 # Palm-facing is negative local Z. Choose broad-pad patch, excluding the tip end.
 choices=sorted(choices,key=lambda v:(v.co-target).length)[:30]
 patch=sorted(choices,key=lambda v:v.co.z)[:8]
 pads[digit]=[v.index for v in patch]
 if len(patch)<4:raise RuntimeError(f'Missing independently weighted pad: {digit}')
result={**asset,'adaptation':'Atlas source skin with source-transferred palm and 15 phalange binding. Runtime target-constrained finger poses; mirrored whole skeleton.','bones':bones,'skinIndices':indices,'skinWeights':weights,'pads':pads,'chains':{k:[list(P(p)) for p in ps] for k,ps in chains.items()}}
serialized=json.dumps(result,separators=(',',':'));version=hashlib.sha256(serialized.encode()).hexdigest()[:12];result['version']=version
(ROOT/'public/models/massage-hand.json').write_text(json.dumps(result,separators=(',',':')))
(ROOT/'src/massageHandVersion.js').write_text(f'export const MASSAGE_HAND_VERSION = "{version}";\n')
(ROOT/'assets/rig').mkdir(exist_ok=True,parents=True);bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/rig/massage-hand.blend'))
print(f'RIGGED HAND: {len(vs)} source vertices, {len(bones)} bones, {len(weights)//4} normalized skin weights, version {version}',flush=True)
