"""Pack BodyParts3D's real skin upper body and musculoskeletal lower body.
The source meshes are retained; the client adds illustrative skinning weights.
"""
import json,pathlib,re,sys
source=pathlib.Path(sys.argv[1]); out=pathlib.Path(__file__).resolve().parents[1]/'public/models'
j=json.loads((source/'atlas.json').read_text()); packed=bytearray(); parts=[]
for p in j['parts']:
 lo,hi=p['bounds']; skin=p['name']=='Skin'
 leg=p['system'] in ('muscular','skeletal') and hi[1]<=1.10 and max(abs(lo[0]),abs(hi[0]))<.19
 if not(skin or leg): continue
 if re.search('coccyge|puborect|pubococc|iliococc|sphincter|perineal',p['name'],re.I): continue
 if p['name']=='Intervertebral disk of third lumbar vertebra': continue
 buf=(source/f"body-{p['chunk']}.bin").read_bytes(); q=dict(p); q.pop('chunk')
 for field,size in [('positions',p['vertexCount']*12),('normals',p['vertexCount']*6),('indices',p['indexCount']*4)]:
  while len(packed)%4: packed.append(0)
  q[field]=len(packed); packed.extend(buf[p[field]:p[field]+size])
 parts.append(q)
(out/'movement.bin').write_bytes(packed)
(out/'movement.json').write_text(json.dumps({'parts':parts,'source':j['source'],'version':j['version']}))
print(f'{len(parts)} Atlas meshes, {len(packed)/1024/1024:.2f} MiB')
