import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sprite, SpriteMaterial, CanvasTexture, AdditiveBlending } from 'three';
import { Pattern, integratedInformation } from '../../models/Simulation';

interface Archetype {
  id: string;
  type: 'clown' | 'tiger' | 'phantom';
  position: [number, number, number];
  phi: number;
  kappa: number;
  speed: number;
  phase: number;
}

const createClownTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ff66aa';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, 2*Math.PI);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(22, 28, 5, 0, 2*Math.PI);
  ctx.arc(42, 28, 5, 0, 2*Math.PI);
  ctx.fill();
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(32, 45, 10, 0, Math.PI);
  ctx.fill();
  return new CanvasTexture(canvas);
};

const createTigerTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ff8800';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#222222';
  for (let i = 0; i < 12; i++) {
    ctx.fillRect(10 + i*4, 20 + (i%2)*10, 2, 30);
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(32, 32, 25, 30, 0, 0, 2*Math.PI);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.fillRect(22, 28, 6, 8);
  ctx.fillRect(38, 28, 6, 8);
  ctx.fillStyle = '#cc0000';
  ctx.fillRect(30, 48, 4, 8);
  return new CanvasTexture(canvas);
};

function createPhantomTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#88aaff';
  ctx.globalAlpha = 0.4;
  ctx.fillRect(0, 0, 64, 64);
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px monospace';
  ctx.fillText('👻', 16, 48);
  return new CanvasTexture(canvas);
}

export const WanderingArchetypes: React.FC<{ patterns: Pattern[] }> = ({ patterns }) => {
  const archetypes = useMemo<Archetype[]>(() => {
    return patterns.filter(p => integratedInformation(p) > 0.2).map((p, idx): Archetype => ({
      id: p.id,
      type: integratedInformation(p) > 0.6 ? 'tiger' : Math.random() > 0.5 ? 'clown' : 'phantom',
      position: [Math.sin(idx)*1.5, 0.2, Math.cos(idx)*1.5] as [number,number,number],
      phi: integratedInformation(p),
      kappa: 0.5,
      speed: 0.5 + Math.random() * 1.5,
      phase: idx * 1.2,
    }));
  }, [patterns]);

  return (
    <div style={{ height: 200, width: '100%', background: '#0a0502', borderRadius: 16, marginTop: 16 }}>
      <Canvas camera={{ position: [0, 2, 5] }}>
        <ambientLight />
        <pointLight position={[2, 3, 2]} />
        {archetypes.map(a => (
          <ArchetypeEntity key={a.id} archetype={a} />
        ))}
      </Canvas>
      <div className="text-center text-xs text-amber-400 mt-1">🎪 Клоуны (низкий Φ*), 🐅 Тигры (высокий Φ*), 👻 Фантомы (угасающие)</div>
    </div>
  );
};

const ArchetypeEntity: React.FC<{ archetype: Archetype }> = ({ archetype }) => {
  const spriteRef = useRef<Sprite | null>(null);
  const { scene } = useThree();

  useEffect(() => {
    let texture: CanvasTexture;
    if (archetype.type === 'clown') texture = createClownTexture();
    else if (archetype.type === 'tiger') texture = createTigerTexture();
    else texture = createPhantomTexture();
    const material = new SpriteMaterial({ map: texture, blending: AdditiveBlending });
    const sprite = new Sprite(material);
    sprite.position.set(...archetype.position);
    sprite.scale.set(0.8, 0.8, 1);
    scene.add(sprite);
    spriteRef.current = sprite;
    return () => { scene.remove(sprite); material.dispose(); texture.dispose(); };
  }, [archetype, scene]);

  useFrame((state) => {
    if (spriteRef.current) {
      const t = state.clock.getElapsedTime();
      const x = archetype.position[0] + Math.sin(t * archetype.speed + archetype.phase) * 0.3;
      const z = archetype.position[2] + Math.cos(t * archetype.speed * 0.7) * 0.3;
      spriteRef.current.position.x = x;
      spriteRef.current.position.z = z;
      if (archetype.type === 'clown') {
        const scale = 0.8 + Math.sin(t * 8) * 0.05;
        spriteRef.current.scale.set(scale, scale, 1);
      }
      if (archetype.type === 'tiger') {
        spriteRef.current.position.y = 0.2 + Math.sin(t * 3) * 0.05;
      }
    }
  });
  return null;
};
