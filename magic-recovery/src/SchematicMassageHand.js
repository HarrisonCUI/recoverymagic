import * as THREE from 'three';

// A deliberately simplified articulated teaching hand. Separate rounded parts
// rotate at joints; there is no skin/web mesh to stretch between fingers.
export function createSchematicMassageHand(surface, technique) {
  const mesh = new THREE.Group();
  mesh.name = 'Rounded articulated teaching hand';
  const material = new THREE.MeshStandardMaterial({color:0xc4d5db,metalness:.12,roughness:.48,transparent:true,opacity:.38,depthWrite:false});
  const accent = new THREE.MeshStandardMaterial({color:0xffb583,metalness:.08,roughness:.6,transparent:true,opacity:.48,depthWrite:false});
  function ball(radius, mat=material) {
    const part=new THREE.Mesh(new THREE.SphereGeometry(radius,24,16),mat.clone());mesh.add(part);return part;
  }
  const palm=ball(1);palm.scale.set(.046,.031,.017);
  const wrist=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,32),material.clone());
  wrist.scale.set(.024,.046,.012);mesh.add(wrist);
  const fingers=[['pinky',-.039,.0055],['ring',-.020,.0065],['middle',0,.007],['index',.020,.0065],['thumb',.036,.008]].map(([name,x,radius])=>{
    const joints=Array.from({length:4},(_,i)=>ball(radius*(i===3?.88:1),i===3&&name==='thumb'?accent:material));
    const links=Array.from({length:3},()=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,1,16),material.clone());mesh.add(m);return m;});
    return {name,x,radius,joints,links};
  });
  material.dispose();accent.dispose();
  const axis=new THREE.Vector3(0,1,0);
  function update(seconds) {
    const t=((seconds%8)+8)%8,u=THREE.MathUtils.clamp((t-1.5)/4.5,0,1),squeeze=Math.sin(Math.PI*u)**2;
    const lift=t<1.5?.027*(1-THREE.MathUtils.smoothstep(t,0,1.5)):t>6?.027*THREE.MathUtils.smoothstep(t,6,8):0;
    const release=.007*(1-squeeze);
    const palmRelease=technique==='knead'?release*.4:0;
    palm.position.set(-.002,surface.cy-.009,surface.cz+surface.r+.032+lift+palmRelease);
    wrist.position.copy(palm.position).add(new THREE.Vector3(-.002,-.040,.002));
    for(const f of fingers) {
      const thumb=f.name==='thumb',open=technique==='knead'||thumb?release:0;
      const angles=thumb?[-.10,-.32,-.58,-.82]:[.10,.39,.70,.99];
      const gaps=thumb?[.027,.017,.006,.003]:[.027,.019,.008,.003];
      const points=angles.map((a,i)=>surface.point(thumb?f.x-.012*(1-i/3):f.x,a,f.radius+gaps[i]+lift+open*(i/3)));
      f.joints.forEach((joint,i)=>joint.position.copy(points[i]));
      f.links.forEach((link,i)=>{
        const direction=points[i+1].clone().sub(points[i]);
        link.position.copy(points[i]).lerp(points[i+1],.5);
        link.quaternion.setFromUnitVectors(axis,direction.clone().normalize());
        link.scale.set(1,direction.length(),1);
      });
    }
  }
  const contactPads=fingers.map(f=>{
    const pad=new THREE.Mesh(new THREE.CircleGeometry(f.name==='thumb'?.007:.005,24),new THREE.MeshBasicMaterial({color:0x00d5ed,toneMapped:false,side:THREE.DoubleSide,transparent:true,opacity:.9,depthWrite:false}));
    const point=surface.point(f.x,f.name==='thumb'?-.82:.99,.0015);
    pad.position.copy(point);pad.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),surface.normal(point));
    mesh.add(pad);return pad;
  });
  update(0);return {mesh,update,surface,fingers,contactPads};
}
