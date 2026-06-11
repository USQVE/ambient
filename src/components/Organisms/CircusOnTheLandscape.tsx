import React, { useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sprite, SpriteMaterial, AdditiveBlending, CanvasTexture } from 'three';
import { Pattern, integratedInformation, History } from '../../models/Simulation';

interface CircusPerformer {
  id: string;
  type: 'clown' | 'tiger' | 'phantom';
  position: [number, number, number];
  phi: number;
  energy: number; // 0..1, влияет на скорость и размер
  phase: number;
  soundCooldown: number;
}

interface CircusProps {
  patterns: Pattern[];
  functionalValue: number;
  bestHistory?: History | null;
  onResonance?: (intensity: number) => void;
}

export interface CircusHandle {
  makeNoise: () => void;
}

// Генерация текстур
const createClownTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  // Фон
  ctx.fillStyle = '#ff66aa';
  ctx.fillRect(0, 0, 128, 128);
  // Лицо
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(64, 64, 50, 60, 0, 0, 2*Math.PI);
  ctx.fill();
  // Глаза
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(44, 54, 10, 0, 2*Math.PI);
  ctx.arc(84, 54, 10, 0, 2*Math.PI);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(40, 50, 3, 0, 2*Math.PI);
  ctx.arc(80, 50, 3, 0, 2*Math.PI);
  ctx.fill();
  // Красный нос
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(64, 70, 12, 0, 2*Math.PI);
  ctx.fill();
  // Рот
  ctx.beginPath();
  ctx.arc(64, 88, 20, 0, Math.PI);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.stroke();
  // Волосы
  ctx.fillStyle = '#ffaa00';
  for (let i = 0; i < 8; i++) {
    ctx.fillRect(20 + i*12, 20, 8, 20);
  }
  return new CanvasTexture(canvas);
};

const createTigerTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ff8800';
  ctx.fillRect(0, 0, 128, 128);
  // Полосы
  ctx.fillStyle = '#222222';
  for (let i = 0; i < 14; i++) {
    ctx.fillRect(20 + i*7, 20 + (i%3)*15, 4, 40);
  }
  // Морда
  ctx.fillStyle = '#ffcc88';
  ctx.beginPath();
  ctx.ellipse(64, 64, 45, 50, 0, 0, 2*Math.PI);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.fillRect(48, 52, 10, 12);
  ctx.fillRect(70, 52, 10, 12);
  ctx.fillStyle = '#cc0000';
  ctx.fillRect(60, 80, 8, 15);
  // Уши
  ctx.fillStyle = '#cc6600';
  ctx.beginPath();
  ctx.moveTo(20, 30);
  ctx.lineTo(40, 10);
  ctx.lineTo(50, 30);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(108, 30);
  ctx.lineTo(88, 10);
  ctx.lineTo(78, 30);
  ctx.fill();
  return new CanvasTexture(canvas);
};

const createPhantomTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#aaccff';
  ctx.globalAlpha = 0.5;
  ctx.fillRect(0, 0, 128, 128);
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px monospace';
  ctx.fillText('👻', 28, 88);
  return new CanvasTexture(canvas);
};

const textures = {
  clown: createClownTexture(),
  tiger: createTigerTexture(),
  phantom: createPhantomTexture(),
};

const PerformerEntity: React.FC<{ performer: CircusPerformer; functionalValue: number }> = ({ performer, functionalValue }) => {
  const spriteRef = useRef<Sprite | null>(null);
  const { scene } = useThree();
  const timeRef = useRef(0);

  useEffect(() => {
    const material = new SpriteMaterial({ map: textures[performer.type], blending: AdditiveBlending });
    const sprite = new Sprite(material);
    sprite.position.set(...performer.position);
    sprite.scale.set(0.8, 0.8, 1);
    scene.add(sprite);
    spriteRef.current = sprite;
    return () => { scene.remove(sprite); material.dispose(); };
  }, [performer.type, performer.position, scene]);

  useFrame((state) => {
    if (!spriteRef.current) return;
    const t = state.clock.getElapsedTime();
    timeRef.current = t;
    // Движение: блуждание по кругу с возмущениями
    const speed = performer.type === 'tiger' ? 0.4 : (performer.type === 'clown' ? 1.2 : 0.6);
    const radius = 1.2 + Math.sin(t * 0.7 + performer.phase) * 0.5;
    const angle = t * speed + performer.phase;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle * 1.3) * radius;
    spriteRef.current.position.x = x;
    spriteRef.current.position.z = z;
    // Высота зависит от энергии (громкости функционала)
    const energy = Math.min(1, functionalValue * 2);
    const yOffset = performer.type === 'clown' ? Math.abs(Math.sin(t * 5)) * 0.3 : 0;
    spriteRef.current.position.y = 0.2 + energy * 0.4 + yOffset;
    // Размер пульсирует у клоунов
    if (performer.type === 'clown') {
      const scale = 0.7 + Math.sin(t * 10) * 0.1;
      spriteRef.current.scale.set(scale, scale, 1);
    }
    if (performer.type === 'tiger') {
      spriteRef.current.scale.set(0.9, 0.9, 1);
    }
  });

  return null;
};

export const CircusOnTheLandscape = forwardRef<CircusHandle, CircusProps>(({ patterns, functionalValue, bestHistory, onResonance }, ref) => {
  const performers = useMemo<CircusPerformer[]>(() => {
    // Берём паттерны с Φ* > 0.2, превращаем в артистов
    return patterns.filter(p => integratedInformation(p) > 0.2).map((p, idx) => {
      const phi = integratedInformation(p);
      let type: 'clown' | 'tiger' | 'phantom' = 'phantom';
      if (phi > 0.6) type = 'tiger';
      else if (phi > 0.3) type = 'clown';
      return {
        id: p.id,
        type,
        position: [Math.sin(idx) * 1.5, 0.2, Math.cos(idx) * 1.5] as [number,number,number],
        phi,
        energy: phi,
        phase: idx * 1.8,
        soundCooldown: 0,
      };
    });
  }, [patterns]);

  // Эффект резонанса: если функционал вырос, тигры рычат, клоуны смеются
  const prevFunctional = useRef(functionalValue);
  useEffect(() => {
    const delta = functionalValue - prevFunctional.current;
    if (delta > 0.05 && onResonance) {
      // Проигрываем случайный звук через Web Audio
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 300 + Math.random() * 200;
      gain.gain.value = 0.1 * Math.min(1, delta * 5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
      osc.stop(audioCtx.currentTime + 0.5);
    }
    prevFunctional.current = functionalValue;
  }, [functionalValue, onResonance]);

  useImperativeHandle(ref, () => ({
    makeNoise: () => {
      // Внешний вызов для кнопки "Покормить тигров"
    }
  }));

  if (performers.length === 0) return null;

  return (
    <div style={{ height: 280, width: '100%', background: '#0a0502', borderRadius: 16, border: '1px solid #b45309', marginTop: 16 }}>
      <Canvas camera={{ position: [0, 2, 5] }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[2, 3, 2]} intensity={0.8} />
        {performers.map(p => (
          <PerformerEntity key={p.id} performer={p} functionalValue={functionalValue} />
        ))}
      </Canvas>
      <div className="text-center text-xs text-amber-300 font-mono mt-1">
        🎪 Цирк на ландшафте: {performers.filter(p => p.type === 'tiger').length} тигров, {performers.filter(p => p.type === 'clown').length} клоунов, {performers.filter(p => p.type === 'phantom').length} фантомов
        {bestHistory && ` | Лучшая история: ${bestHistory.slice(0,3).join('→')}...`}
      </div>
    </div>
  );
});
