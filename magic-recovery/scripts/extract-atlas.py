import json,pathlib,re,sys
source=pathlib.Path(sys.argv[1]); out=pathlib.Path(__file__).resolve().parents[1]/'public/models'
j=json.loads((source/'atlas.json').read_text()); packed=bytearray(); parts=[]
for p in j['parts']:
 lo,hi=p['bounds']
 if p['name']=='Intervertebral disk of third lumbar vertebra': continue
 if p['system'] not in ('muscular','skeletal') or hi[1]>1.06 or max(abs(lo[0]),abs(hi[0]))>.19: continue
 if re.search('coccyge|puborect|pubococc|iliococc|sphincter|perineal',p['name'],re.I): continue
 buf=(source/f"body-{p['chunk']}.bin").read_bytes(); q=dict(p); q.pop('chunk')
 for field,size in [('positions',p['vertexCount']*12),('normals',p['vertexCount']*6),('indices',p['indexCount']*4)]:
  while len(packed)%4: packed.append(0)
  q[field]=len(packed); packed.extend(buf[p[field]:p[field]+size])
 parts.append(q)
out.mkdir(exist_ok=True,parents=True); (out/'legs.bin').write_bytes(packed); (out/'legs.json').write_text(json.dumps({'parts':parts,'source':j['source'],'version':j['version']}))
print(f'{len(parts)} meshes, {len(packed)/1024/1024:.2f} MB, {sum(p["indexCount"] for p in parts)//3} triangles')
