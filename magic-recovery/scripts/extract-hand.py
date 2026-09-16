"""Create a compact, continuous reference hand from the licensed Atlas skin.
Clip at the forearm, seal the cut, then align fingers upward and palm toward -Z.
No separate sphere/capsule fingers are used.
"""
import json,struct,math,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
meta=json.loads((root/'public/models/movement.json').read_text())
p=next(p for p in meta['parts'] if p['name']=='Skin')
b=(root/'public/models/movement.bin').read_bytes()
v=[struct.unpack_from('<fff',b,p['positions']+i*12) for i in range(p['vertexCount'])]
n=[tuple(x/32767 for x in struct.unpack_from('<hhh',b,p['normals']+i*6)) for i in range(p['vertexCount'])]
idx=struct.unpack_from('<'+'I'*p['indexCount'],b,p['indices'])
cut=.925; vertices=[]; normals=[]; indices=[]; lookup={}; boundary={}
def add(pos,nor):
 key=tuple(round(x,7) for x in pos)
 if key not in lookup:
  lookup[key]=len(vertices); vertices.append(pos); normals.append(nor)
 return lookup[key]
for i in range(0,len(idx),3):
 ids=idx[i:i+3]
 if not all(v[k][0]>.20 for k in ids): continue
 poly=[(v[k],n[k]) for k in ids]; out=[]
 for a,z in zip(poly,poly[1:]+poly[:1]):
  inside=a[0][1]<=cut; other=z[0][1]<=cut
  if inside: out.append(a)
  if inside!=other:
   t=(cut-a[0][1])/(z[0][1]-a[0][1]); pos=tuple(a[0][j]+t*(z[0][j]-a[0][j]) for j in range(3)); nor=tuple(a[1][j]+t*(z[1][j]-a[1][j]) for j in range(3))
   out.append((pos,nor)); boundary[tuple(round(x,7) for x in pos)]=pos
 if len(out)<3: continue
 ids=[add(*pair) for pair in out]
 for k in range(1,len(ids)-1): indices.extend([ids[0],ids[k],ids[k+1]])
# Separate cap vertices keep a clean, flat wrist end.
ring=list(boundary.values()); center=tuple(sum(p[i] for p in ring)/len(ring) for i in range(3))
ring.sort(key=lambda p:math.atan2(p[2]-center[2],p[0]-center[0]),reverse=True)
base=len(vertices);vertices.append(center);normals.append((0,1,0))
for pos in ring: vertices.append(pos);normals.append((0,1,0))
for i in range(len(ring)):indices.extend([base,base+1+i,base+1+(i+1)%len(ring)])
angle=math.radians(23);c=math.cos(angle);s=math.sin(angle)
def rotate(p): return (p[0],-c*p[1]+s*p[2],-s*p[1]-c*p[2])
posed=[rotate(p) for p in vertices]; xmin,xmax=min(p[0] for p in posed),max(p[0] for p in posed); ymax=max(p[1] for p in posed); zmin=min(p[2] for p in posed)
# Keep the existing gesture's local origin at the finger pads; modest illustration scale.
scale=.72; xcenter=(xmin+xmax)/2
positions=[round(q,7) for p in posed for q in ((p[0]-xcenter)*scale,(p[1]-ymax)*scale,(p[2]-zmin)*scale+.001)]
ns=[]
for normal in normals:
 norm=rotate(normal); length=math.sqrt(sum(x*x for x in norm)) or 1;ns.extend(round(x/length,6) for x in norm)
asset={'source':'Human Atlas / BodyParts3D Skin, CC BY 4.0','sourcePart':p['id'] if isinstance(p,dict) else 'Skin','adaptation':'Left reference hand, forearm clipping, closed cap, reoriented and scaled for surface-touch teaching. Mirrored at runtime.','positions':positions,'normals':ns,'indices':indices}
(root/'public/models/hand.json').write_text(json.dumps(asset,separators=(',',':')))
print(f'{len(vertices)} vertices, {len(indices)//3} triangles, {(root/"public/models/hand.json").stat().st_size/1024:.1f} KiB')
