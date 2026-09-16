import bpy, bmesh, json, math, struct, pathlib, sys
from mathutils import Vector, Matrix, Quaternion
from mathutils.geometry import barycentric_transform
ROOT=pathlib.Path(__file__).resolve().parents[2]
OUT=ROOT/'public/models/rigged'; OUT.mkdir(exist_ok=True)
AUTHOR=ROOT/'assets/rig';AUTHOR.mkdir(parents=True,exist_ok=True)
def log(s): print('RIG: '+s,flush=True)
def V(a): return Vector((a[0],-a[2],a[1]))
def native(a): return (a.x,a.z,-a.y)
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
meta=json.loads((ROOT/'public/models/movement.json').read_text()); part=next(p for p in meta['parts'] if p['name']=='Skin'); data=(ROOT/'public/models/movement.bin').read_bytes()
pts=[struct.unpack_from('<fff',data,part['positions']+i*12) for i in range(part['vertexCount'])]
ii=struct.unpack_from('<'+'I'*part['indexCount'],data,part['indices']); faces=[ii[i:i+3] for i in range(0,len(ii),3)]
par=list(range(len(pts)))
def root(i):
 while par[i]!=i: par[i]=par[par[i]];i=par[i]
 return i
for a,b,c in faces:par[root(a)]=root(b);par[root(b)]=root(c)
groups={}
for i,p in enumerate(pts):groups.setdefault(root(i),[]).append(i)
# Keep a single complete outer scan surface.
large=sorted(groups.values(),key=len,reverse=True)[:2]
chosen=max(large,key=lambda g:sum(pts[i][0]**2+pts[i][2]**2 for i in g)/len(g));keep=set(chosen)
faces=[f for f in faces if f[0] in keep]
log(f'Outer skin: {len(chosen)} vertices / {len(faces)} triangles')
mesh_maps={}
def mesh(name,points,triangles):
 remap={}; vs=[]; fs=[]
 for f in triangles:
  ff=[]
  for i in f:
   if i not in remap:remap[i]=len(vs);vs.append(V(points[i]))
   ff.append(remap[i])
  fs.append(ff)
 m=bpy.data.meshes.new(name);m.from_pydata(vs,[],fs);m.update();o=bpy.data.objects.new(name,m);bpy.context.collection.objects.link(o)
 bm=bmesh.new();bm.from_mesh(m)
 if name not in ['Atlas_Bind_Surface','Atlas_Body']:bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
 if name!='Atlas_Body':bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
 bm.to_mesh(m);bm.free()
 for p in m.polygons:p.use_smooth=True
 mesh_maps[name]=remap
 return o
body=mesh('Atlas_Bind_Surface',pts,faces)
# Carry the source surface's consistent winding through the clothing cut.
source_index={index:source for source,index in mesh_maps['Atlas_Bind_Surface'].items()}
faces=[tuple(source_index[i] for i in p.vertices) for p in body.data.polygons]
# Hierarchical anatomical rig with actual palm/phalange joints.
spec=[]
def bone(name,head,tail,parent=None,deform=True):spec.append((name,head,tail,parent,deform))
bone('pelvis',(0,.9,-.025),(0,1.01,-.025))
bone('spine',(0,1.01,-.025),(0,1.20,-.025),'pelvis')
bone('chest',(0,1.20,-.025),(0,1.40,-.025),'spine')
bone('neck',(0,1.40,-.025),(0,1.50,-.025),'chest')
bone('head',(0,1.50,-.025),(0,1.66,-.025),'neck')
FINGERS={'pinky':[(.224,.818,.032),(.222,.777,.058),(.222,.758,.077),(.222,.753,.088)],'ring':[(.247,.829,.025),(.247,.780,.047),(.247,.749,.078),(.247,.741,.1)],'middle':[(.273,.837,.020),(.273,.783,.040),(.275,.740,.073),(.274,.729,.098)],'index':[(.298,.837,.026),(.302,.784,.035),(.307,.751,.067),(.307,.739,.090)],'thumb':[(.297,.866,.030),(.315,.841,.039),(.324,.818,.065),(.325,.798,.078)]}
for side,sign in [('L',1),('R',-1)]:
 def P(a):return (a[0]*sign,a[1],a[2])
 bone('thigh.'+side,P((.09,.9,-.025)),P((.077,.45,-.022)),'pelvis')
 bone('shin.'+side,P((.077,.45,-.022)),P((.082,.085,-.018)),'thigh.'+side)
 bone('foot.'+side,P((.082,.085,-.018)),P((.082,.035,.15)),'shin.'+side)
 bone('clavicle.'+side,P((.025,1.355,-.025)),P((.185,1.39,-.025)),'chest')
 bone('upper_arm.'+side,P((.185,1.39,-.025)),P((.228,1.11,-.015)),'clavicle.'+side)
 bone('forearm.'+side,P((.228,1.11,-.015)),P((.265,.89,.005)),'upper_arm.'+side)
 bone('hand.'+side,P((.265,.89,.005)),P((.272,.834,.025)),'forearm.'+side)
 bone('forearm_twist.'+side,P((.2465,1.0,-.005)),P((.265,.89,.005)),'forearm.'+side)
 for digit,chain in FINGERS.items():
  for k in range(3):bone(f'{digit}{k+1}.{side}',P(chain[k]),P(chain[k+1]),'hand.'+side if k==0 else f'{digit}{k}.{side}')
armdata=bpy.data.armatures.new('Atlas_Anatomical_Rig');arm=bpy.data.objects.new('Atlas_Anatomical_Rig',armdata);bpy.context.collection.objects.link(arm);bpy.context.view_layer.objects.active=arm;arm.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,h,t,parent,deform in spec:
 b=armdata.edit_bones.new(name);b.head=V(h);b.tail=V(t);b.use_deform=deform
 if parent:b.parent=armdata.edit_bones[parent];b.use_connect=(b.head-b.parent.tail).length<1e-5
bpy.ops.object.mode_set(mode='OBJECT')
# Heat diffusion binding on the full single shell, before garment clipping.
bpy.ops.object.select_all(action='DESELECT');body.select_set(True);arm.select_set(True);bpy.context.view_layer.objects.active=arm
log('Automatic heat-weight binding started')
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
unbound=sum(not v.groups for v in body.data.vertices)
log(f'Heat binding complete; unweighted vertices: {unbound}')
if unbound:raise RuntimeError('Automatic binding left unweighted vertices')
# Constrain heat weights by connected anatomical region. In the rest scan,
# fingers sit close to the upper thighs; unrestricted heat can cross that gap.
n=len(body.data.vertices);parents=list(range(n))
def find(i):
 while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
 return i
for e in body.data.edges:
 a,b=e.vertices
 if body.data.vertices[a].co.z<1.2 and body.data.vertices[b].co.z<1.2:parents[find(a)]=find(b)
stats={}
for v in body.data.vertices:
 if v.co.z<1.2:
  z=stats.setdefault(find(v.index),[0,0]);z[0]+=v.co.x;z[1]+=1
names=[g.name for g in body.vertex_groups]
def dist_segment(point,b):
 d=b.tail_local-b.head_local;t=max(0,min(1,(point-b.head_local).dot(d)/d.length_squared));return (point-b.head_local-d*t).length
corrected=0
for v in body.data.vertices:
 x,y,z=native(v.co);armregion=False
 if y<1.2:
  total,count=stats[find(v.index)];armregion=abs(total/count)>.22
 side='L' if x>0 else 'R'
 if armregion:
  allowed=[name for name in names if name.endswith('.'+side) and not name.startswith(('thigh','shin','foot'))]
  if y<.815:
   digit=min(FINGERS,key=lambda digit:min(dist_segment(v.co,arm.data.bones[f'{digit}{k}.{side}']) for k in [1,2,3]))
   allowed=[f'{digit}{k}.{side}' for k in [1,2,3]]+['hand.'+side]
  elif y<.875:
   allowed=['hand.'+side]+[f'{digit}{k}.{side}' for digit in FINGERS for k in [1,2,3]]
 elif y<.97:
  allowed=['pelvis','spine']+[name for name in names if name.startswith(('thigh','shin','foot')) and (abs(x)<.035 or name.endswith('.'+side))]
 elif y<1.2:allowed=['pelvis','spine','chest']
 elif y<1.45:
  allowed=['spine','chest','neck']
  if abs(x)>.12:allowed+=['clavicle.'+side,'upper_arm.'+side]
 else:allowed=['neck','head']
 weights={names[g.group]:g.weight for g in v.groups if names[g.group] in allowed}
 # The elbow is a two-bone hinge region. Heat weights from the short twist
 # helper must not spread into it and produce an abrupt spiral/collapse.
 if armregion and .875<=y<=.94:
  hand=1-smooth(.875,.925,y)
  weights={'hand.'+side:hand,'forearm_twist.'+side:1-hand}
  allowed=list(weights)
 elif armregion and .94<y<1.23:
  upper=smooth(1.045,1.18,y)
  twist=1-smooth(.94,1.045,y)
  weights={'upper_arm.'+side:upper,'forearm.'+side:(1-upper)*(1-twist),'forearm_twist.'+side:(1-upper)*twist}
  allowed=list(weights)
 removed=[g.group for g in v.groups if names[g.group] not in allowed]
 if removed:corrected+=1
 for group in removed:body.vertex_groups[group].remove([v.index])
 if sum(weights.values())<1e-5:
  nearest=sorted(allowed,key=lambda name:dist_segment(v.co,arm.data.bones[name]))[:3]
  weights={name:1/max(.005,dist_segment(v.co,arm.data.bones[name]))**4 for name in nearest}
 total=sum(weights.values())
 for name,w in weights.items():body.vertex_groups[name].add([v.index],w/total,'REPLACE')
log(f'Anatomical region constraints applied to {corrected} vertices')
# A narrow, continuous shoulder/torso paint field bridges the classification
# boundary at the axilla. Keep the rest of the anatomical binding intact.
for v in body.data.vertices:
 x,y,z=native(v.co);ax=abs(x)
 amount=smooth(1.08,1.12,y)*(1-smooth(1.26,1.32,y))*smooth(.09,.125,ax)*(1-smooth(.19,.23,ax))
 if amount<1e-6:continue
 side='L' if x>0 else 'R';upper=smooth(.12,.19,ax)
 old={body.vertex_groups[g.group].name:g.weight for g in v.groups}
 target={'upper_arm.'+side:upper,'chest':1-upper}
 for g in list(v.groups):body.vertex_groups[g.group].remove([v.index])
 for name in set(old)|set(target):
  w=(1-amount)*old.get(name,0)+amount*target.get(name,0)
  if w>1e-7:body.vertex_groups[name].add([v.index],w,'REPLACE')
# Keep at most four weights and normalize for glTF/WebGL.
bpy.context.view_layer.objects.active=body;bpy.ops.object.vertex_group_limit_total(limit=4);bpy.ops.object.vertex_group_normalize_all(lock_active=False)
# Keep a native-space UV for selection tint in the viewer.
def source_uv(o):
 uv=o.data.uv_layers.new(name='AtlasCoordinates')
 for p in o.data.polygons:
  for li in p.loop_indices:
   v=o.data.vertices[o.data.loops[li].vertex_index].co
   uv.data[li].uv=(v.x,v.z)
source_uv(body)
# Clip the visible skin exactly at garment openings, preserving the arms.
def clip(poly,y,above):
 out=[]
 for a,b in zip(poly,poly[1:]+poly[:1]):
  ai=a[1]>=y if above else a[1]<=y;bi=b[1]>=y if above else b[1]<=y
  if ai:out.append(a)
  if ai!=bi:
   t=(y-a[1])/(b[1]-a[1]);out.append(tuple(a[k]+(b[k]-a[k])*t for k in range(3)))
 return out
# Preserve arm/trunk identity when clipping clothing; a coordinate cutoff
# would cut the inner forearm where it passes close to the waist in the scan.
ap=list(range(len(pts)))
def ar(i):
 while ap[i]!=i:ap[i]=ap[ap[i]];i=ap[i]
 return i
for face in faces:
 for k in range(3):
  a,b=face[k],face[(k+1)%3]
  if pts[a][1]<1.2 and pts[b][1]<1.2:ap[ar(a)]=ar(b)
asums={}
for i,p in enumerate(pts):
 if p[1]<1.2:
  stat=asums.setdefault(ar(i),[0,0]);stat[0]+=p[0];stat[1]+=1
sourceArm=[int(abs(asums[ar(i)][0]/asums[ar(i)][1])>.22) if p[1]<1.2 else 0 for i,p in enumerate(pts)]
source_weights={source:{g.group:g.weight for g in body.data.vertices[index].groups} for source,index in mesh_maps['Atlas_Bind_Surface'].items()}
visible_pts=[];visible_faces=[];visible_weights=[];point_keys={}
for f in faces:
 poly=[pts[i] for i in f]
 # Below armpit, arms are outside this band; only central body is clothed.
 torso=all(sourceArm[i]==0 for i in f)
 polys=[clip(poly,.705,False),clip(poly,1.035,True)] if torso else [poly]
 for poly in polys:
  vertex_ids=[]
  for p in poly:
   original=next((i for i in f if pts[i]==p),None)
   if original is not None:weights=source_weights[original].copy()
   else:
    alpha=barycentric_transform(V(p),V(pts[f[0]]),V(pts[f[1]]),V(pts[f[2]]),Vector((1,0,0)),Vector((0,1,0)),Vector((0,0,1)))
    weights={}
    for k in range(3):
     for group,w in source_weights[f[k]].items():weights[group]=weights.get(group,0)+max(0,alpha[k])*w
    weights={g:w for g,w in weights.items() if w>1e-7};total=sum(weights.values());weights={g:w/total for g,w in weights.items()}
   # Keep coincident arm and trunk vertices separate when their ownership
   # differs. A nearest-surface transfer cannot distinguish them.
   key=tuple(round(x,6) for x in p)+tuple(sorted((g,round(w,5)) for g,w in weights.items() if round(w,5)>0))
   if key not in point_keys:
    point_keys[key]=len(visible_pts);visible_pts.append(p);visible_weights.append(weights)
   vertex_ids.append(point_keys[key])
  for i in range(1,len(poly)-1):visible_faces.append((vertex_ids[0],vertex_ids[i],vertex_ids[i+1]))
visible=mesh('Atlas_Body',visible_pts,visible_faces)
for g in body.vertex_groups:visible.vertex_groups.new(name=g.name)
for source,index in mesh_maps['Atlas_Body'].items():
 for group,w in visible_weights[source].items():visible.vertex_groups[group].add([index],w,'REPLACE')
mod=visible.modifiers.new('Atlas skeleton','ARMATURE');mod.object=arm;visible.parent=arm
bpy.context.view_layer.objects.active=visible;bpy.ops.object.vertex_group_limit_total(limit=4);bpy.ops.object.vertex_group_normalize_all(lock_active=False)
clothdata=json.loads((ROOT/'scripts/rig/clothing.json').read_text()); cp=list(zip(*[iter(clothdata['positions'])]*3));cf=list(zip(*[iter(clothdata['indices'])]*3));cloth=mesh('Sports_Shorts',cp,cf)
def transfer(o):
 for g in body.vertex_groups:o.vertex_groups.new(name=g.name)
 mod=o.modifiers.new('Transferred anatomical skin weights','DATA_TRANSFER');mod.object=body;mod.use_vert_data=True;mod.data_types_verts={'VGROUP_WEIGHTS'};mod.vert_mapping='POLYINTERP_NEAREST'
 bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 mod=o.modifiers.new('Atlas skeleton','ARMATURE');mod.object=arm;o.parent=arm
 bpy.ops.object.vertex_group_limit_total(limit=4);bpy.ops.object.vertex_group_normalize_all(lock_active=False)
transfer(cloth);source_uv(visible)
# Paint the connected fabric bridge continuously across both hips. Nearest
# surface transfer is ambiguous at the crotch between two different thighs.
skin_hem=[v for v in visible.data.vertices if abs(v.co.z-.705)<1e-5 and abs(v.co.x)<.2]
for v in cloth.data.vertices:
 x,y,z=native(v.co);pelvis=smooth(.84,.99,y);left=smooth(-.045,.045,x)
 transferred={cloth.vertex_groups[g.group].name:g.weight for g in v.groups}
 if abs(y-.705)<1e-5:
  seam=min(skin_hem,key=lambda sv:(sv.co-v.co).length_squared)
  if (seam.co-v.co).length<1e-4:transferred={visible.vertex_groups[g.group].name:g.weight for g in seam.groups}
 bridge=smooth(.710,.800,y)
 painted={'pelvis':pelvis,'thigh.L':(1-pelvis)*left,'thigh.R':(1-pelvis)*(1-left)}
 # The sewn hem and the exposed skin have identical bind positions. Keep
 # their transferred weights identical too; a two-thigh blend at the hem
 # pulls the inner cuff away by centimetres when only one hip flexes.
 weights={name:(1-bridge)*transferred.get(name,0)+bridge*painted.get(name,0) for name in set(transferred)|set(painted)}
 for group in list(v.groups):cloth.vertex_groups[group.group].remove([v.index])
 for name,w in weights.items():
  if w>0:cloth.vertex_groups[name].add([v.index],w,'REPLACE')
bpy.context.view_layer.objects.active=cloth;bpy.ops.object.vertex_group_limit_total(limit=4);bpy.ops.object.vertex_group_normalize_all(lock_active=False)
# Neutral learning figure and nontransparent shorts.
def material(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;bs=next(n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=.8;return m
visible.data.materials.append(material('Atlas silver',(.53,.60,.61)));cloth.data.materials.append(material('Opaque sports shorts',(.045,.072,.09)))
body.hide_render=True;body.hide_set(True)
arm['source']='Human Atlas / BodyParts3D, CC BY 4.0';arm['binding']='Blender anatomically constrained heat diffusion, normalized four influences, parented anatomical bones with three phalanges per digit'
bpy.ops.wm.save_as_mainfile(filepath=str(AUTHOR/'atlas-bound.blend'))
log('Bound rig saved')
# Bake fixed-length FK / two-bone IK into named actions. Playback uses the
# exported animation channels, never a run-time vertex-position warp.
rest={b.name:b.matrix_local.copy() for b in arm.data.bones}
def update():bpy.context.view_layer.update()
def head(name):
 pb=arm.pose.bones[name]
 return pb.parent.matrix @ (pb.parent.bone.matrix_local.inverted() @ pb.bone.head_local) if pb.parent else pb.bone.head_local.copy()
def orient(name,direction):
 pb=arm.pose.bones[name]; origin=head(name); bind=pb.bone.tail_local-pb.bone.head_local
 q=bind.normalized().rotation_difference(direction.normalized()) @ rest[name].to_quaternion()
 pb.matrix=Matrix.LocRotScale(origin,q,Vector((1,1,1)));update()
def aim(name,start,end):orient(name,end-start)
def solve_arm(side,target,pole,require_reachable=False):
 upper=arm.pose.bones['upper_arm.'+side];fore=arm.pose.bones['forearm.'+side]
 start=head(upper.name);l1=upper.bone.length;l2=fore.bone.length
 delta=target-start
 if require_reachable:assert delta.length<(l1+l2)*.98, 'Support wrist must be reachable with a bent elbow: '+side
 distance=min(delta.length,l1+l2-.004);direction=delta.normalized();target=start+direction*distance
 along=(l1*l1-l2*l2+distance*distance)/(2*distance)
 perp=pole-direction*pole.dot(direction);perp.normalize()
 elbow=start+direction*along+perp*math.sqrt(max(0,l1*l1-along*along))
 if require_reachable:
  # Inner elbow and inner forearm face the same flexion plane. Merely
  # pointing bone axes independently gives unrelated axial rolls.
  contact_orientation(upper.name,elbow-start,target-elbow)
  contact_orientation(fore.name,target-elbow,start-elbow)
 else:
  aim(upper.name,start,elbow);aim(fore.name,elbow,target)
 return head('hand.'+side)
def contact_orientation(name,forward,normal):
 # Map a complete anatomical frame, not only the bone's longitudinal axis.
 # Shortest-arc direction alignment loses the palm's roll on the phalanges.
 pb=arm.pose.bones[name]
 source_forward=(pb.bone.tail_local-pb.bone.head_local).normalized()
 source_normal=V((0,0,1));source_normal=(source_normal-source_forward*source_normal.dot(source_forward)).normalized()
 source_across=source_forward.cross(source_normal).normalized()
 target_forward=forward.normalized();target_normal=(normal-target_forward*normal.dot(target_forward)).normalized()
 target_across=target_forward.cross(target_normal).normalized()
 source=Matrix((source_across,source_forward,source_normal)).transposed()
 target=Matrix((target_across,target_forward,target_normal)).transposed()
 delta=(target @ source.inverted()).to_quaternion()
 pb.matrix=Matrix.LocRotScale(head(name),delta @ rest[name].to_quaternion(),Vector((1,1,1)));update()
def finger_pose(side,sign):
 # A support cradle: fingers run across the posterior thigh, palms face
 # forward into it. The hands are staggered along the thigh, not squeezing
 # its sides with spread upright fingers.
 back=V((0,.414,.910));inward=V((-sign,0,0))
 d=(back*.916+inward*.40).normalized();n=(inward*.916-back*.40).normalized()
 contact_orientation('hand.'+side,d,n)
 for digit in FINGERS:
  if digit=='thumb':continue
  for k,angle in enumerate([.12,.30,.50]):
   contact_orientation(f'{digit}{k+1}.{side}',d*math.cos(angle)+n*math.sin(angle),n*math.cos(angle)-d*math.sin(angle))
# Surface-fitted wrist positions: the Atlas scan's two hands are asymmetric.
# Keep fingertips around the posterior thigh, not pointing away behind it.
SUPPORT_WRISTS={
 'right':{'L':(.1125,.425,-.0964),'R':(.1265,.385,-.1204)},
 'left':{'L':(.1265,.425,-.1524),'R':(.1165,.415,-.0824)},
}
clips=json.loads((ROOT/'scripts/rig/poses.json').read_text())
bpy.context.scene.render.fps=12
for clip in clips:
 action=bpy.data.actions.new(clip['name']);arm.animation_data_create();arm.animation_data.action=action
 for frame,p in enumerate(clip['frames'],1):
  for pb in arm.pose.bones:pb.matrix_basis=Matrix.Identity(4);pb.rotation_mode='QUATERNION'
  j=p['joints'];supine=clip['region']=='supine';signActive=1 if clip['side']=='left' else -1
  rootbone=arm.pose.bones['pelvis'];delta=V((0,1,0)).rotation_difference(V(j['chest'])-V(j['pelvis']));rootbone.matrix=Matrix.LocRotScale(V(j['pelvis']),delta @ rest['pelvis'].to_quaternion(),Vector((1,1,1)));update()
  for side,sign,long in [('L',1,'left'),('R',-1,'right')]:
   knee=V(j[long+'Knee']);ankle=V(j[long+'Ankle'])
   if supine and sign==signActive:
    knee=V((sign*.09,.64,-.20))
   aim('thigh.'+side,head('thigh.'+side),knee)
   if supine and sign==signActive:
    # Compute the ankle from the ACTUAL knee after fixed-length FK.
    # 1.65–2.00 rad from downward clears the posterior support hands;
    # the previous .42–.67 folded the shin almost onto the thigh.
    angle=1.65+.35*p['pulse']
    ankle=head('shin.'+side)+V((0,-math.cos(angle),math.sin(angle)))*arm.data.bones['shin.'+side].length
   aim('shin.'+side,head('shin.'+side),ankle)
   foot=arm.pose.bones['foot.'+side]
   if supine:
    shin=arm.pose.bones['shin.'+side];direction=native(shin.tail-shin.head)
    ankle_angle=-math.atan2(direction[2],-direction[1])+.08
    fq=Quaternion(V((1,0,0)),ankle_angle) @ rest[foot.name].to_quaternion()
   else:fq=Quaternion(V((1,0,0)),p['feet'][long]['x']) @ Quaternion(V((0,0,1)),p['feet'][long]['z']) @ rest[foot.name].to_quaternion()
   foot.matrix=Matrix.LocRotScale(head(foot.name),fq,Vector((1,1,1)));update()
   if supine:
    reach,height,depth=SUPPORT_WRISTS[clip['side']][side]
    target=V((signActive*.09+sign*reach,height,depth))
    # Swivel the elbow to minimize wrist bending while keeping limb lengths.
    approach=V((-sign*.40,.414*.916,.910*.916)).normalized()
    solve_arm(side,target,-approach,require_reachable=True)
    finger_pose(side,sign)
   else:
    solve_arm(side,V(j[long+'Hand']),V((sign*.8,.15,.2)))
    # Neutral wrist with a small extension on the chair/thigh support.
    arm.pose.bones['hand.'+side].rotation_quaternion=Quaternion((1,0,0),-.12);update()
   # Distribute only wrist pronation/supination to a forearm twist bone.
   fore=arm.pose.bones['forearm.'+side];hand=arm.pose.bones['hand.'+side];tw=arm.pose.bones['forearm_twist.'+side]
   rel=fore.matrix.to_quaternion().inverted() @ hand.matrix.to_quaternion()
   tq=Quaternion((rel.w,0,rel.y,0));tq.normalize();tq=Quaternion().slerp(tq,.5)
   tw.matrix=Matrix.LocRotScale(head(tw.name),fore.matrix.to_quaternion() @ tq,Vector((1,1,1)));update()
  for pb in arm.pose.bones:
   pb.keyframe_insert('location',frame=frame,group=pb.name);pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name);pb.keyframe_insert('scale',frame=frame,group=pb.name)
 # NLA strips are exported as individual named clips.
 track=arm.animation_data.nla_tracks.new();track.name=clip['name'];strip=track.strips.new(clip['name'],1,action);track.mute=True
 log('Baked '+clip['name'])
arm.animation_data.action=None
for pb in arm.pose.bones:pb.matrix_basis=Matrix.Identity(4)
update()
# No disabled NLA tracks in export: exporter samples each strip in isolation.
for tr in arm.animation_data.nla_tracks:tr.mute=False
bpy.context.scene.frame_start=1;bpy.context.scene.frame_end=73
bpy.ops.wm.save_as_mainfile(filepath=str(AUTHOR/'atlas-animated.blend'))
bpy.ops.object.select_all(action='DESELECT');arm.select_set(True);visible.select_set(True);cloth.select_set(True);bpy.context.view_layer.objects.active=arm
bpy.ops.export_scene.gltf(filepath=str(OUT/'atlas-recovery.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_frame_range=False,export_extras=True,export_skins=True,export_yup=True)
report={'bones':len(arm.data.bones),'unweightedVertices':unbound,'clips':[c['name'] for c in clips],'source':'Human Atlas / BodyParts3D CC BY 4.0','pipeline':'Anatomically constrained Blender heat weights, continuous cloth weights, 4 influences, hierarchical bones, FK legs + two-bone arm IK, forearm twist, phalange rotations, baked clips'}
(OUT/'rig-report.json').write_text(json.dumps(report,indent=2));log('Export complete')

import hashlib
revision=hashlib.sha256((OUT/'atlas-recovery.glb').read_bytes()).hexdigest()[:12]
(ROOT/'src/rigVersion.js').write_text('// Generated by scripts/rig/build-rig.py\nexport const RIG_VERSION = '+json.dumps(revision)+';\n')
