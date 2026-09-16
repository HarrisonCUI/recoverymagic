import * as THREE from 'three';

// Abstract contact markers, deliberately independent of hand skin and rigging.
// Orange represents the thumb pad; silver represents the other four pads.
export function createMassageContactPoints(surface, technique) {
  const mesh = new THREE.Group();
  const digits = [
    ['pinky', -.044, .0075], ['ring', -.020, .0075],
    ['middle', -.0005, .0075], ['index', .018, .0075],
    ['thumb', .034, .010],
  ];
  const markers = new Map(digits.map(([name, axial, radius]) => {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 24, 16),
      new THREE.MeshStandardMaterial({
        color: name === 'thumb' ? 0xff8c49 : 0xcbe7f0,
        emissive: name === 'thumb' ? 0x74300b : 0x233a45,
        emissiveIntensity: .45, metalness: .15, roughness: .38,
      }),
    );
    sphere.name = `contact-${name}`;
    mesh.add(sphere);
    return [name, { sphere, axial, radius }];
  }));
  function update(seconds) {
    const t = ((seconds % 8) + 8) % 8;
    const u = THREE.MathUtils.clamp((t - 1.5) / 4.5, 0, 1);
    const squeeze = Math.sin(Math.PI * u) ** 2;
    const lift = t < 1.5 ? .025 * (1 - THREE.MathUtils.smoothstep(t, 0, 1.5))
      : t > 6 ? .025 * THREE.MathUtils.smoothstep(t, 6, 8) : 0;
    for (const [name, { sphere, axial, radius }] of markers) {
      const thumb = name === 'thumb';
      // Knead: opposing pads approach together. Thumb: four supports stay still.
      const angle = thumb ? -.76 : .88;
      const release = technique === 'knead' || thumb ? .008 * (1 - squeeze) : 0;
      sphere.position.copy(surface.point(axial, angle, radius + .002 + release + lift));
    }
  }
  update(0);
  return { mesh, update, surface, markers };
}
