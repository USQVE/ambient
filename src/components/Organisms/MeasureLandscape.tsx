import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import { History, Measure, kappa, activePatterns, integratedInformation } from '../../models/Simulation';

interface Point {
  x: number;
  z: number;
  y: number;
  history: History;
}

interface MeasureLandscapeProps {
  measure: Measure;
  histories: History[];
  geodesicPath?: Array<{x:number, z:number, y:number, label:string}>;
  showGradients?: boolean;
}

const LandscapeMesh: React.FC<{ points: Point[]; geodesicPoints?: Array<{x:number, z:number, y:number}> }> = ({ points, geodesicPoints }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.003;
  });

  const resolution = 30;
  const vertices: number[] = [];
  const indices: number[] = [];
  const colors: number[] = [];

  for (let i = 0; i <= resolution; i++) {
    const x = i / resolution - 0.5;
    for (let j = 0; j <= resolution; j++) {
      const z = j / resolution - 0.5;
      let weightSum = 0;
      let height = 0;
      for (const p of points) {
        const dist = Math.hypot(x - p.x, z - p.z);
        const w = Math.exp(-dist * 20);
        weightSum += w;
        height += w * p.y;
      }
      const y = weightSum > 0 ? height / weightSum : 0;
      vertices.push(x, y * 2, z);
      const r = 0.8 + y * 0.2;
      const g = 0.6 + y * 0.3;
      const b = 0.3 + y * 0.2;
      colors.push(r, g, b);
    }
  }

  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const a = i * (resolution + 1) + j;
      const b = i * (resolution + 1) + j + 1;
      const c = (i + 1) * (resolution + 1) + j;
      const d = (i + 1) * (resolution + 1) + j + 1;
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    geom.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geom.computeVertexNormals();
    return geom;
  }, [points]);

  return (
    <group>
      <mesh ref={meshRef} rotation={[-0.5, 0, 0]} geometry={geometry}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.4} metalness={0.1} />
      </mesh>
      {geodesicPoints && geodesicPoints.length > 1 && (
        <Line
          points={geodesicPoints.map(p => [p.x, p.y * 2 + 0.05, p.z] as [number, number, number])}
          color="#ffaa44"
          lineWidth={3}
          dashed={false}
        />
      )}
    </group>
  );
};

export const MeasureLandscape: React.FC<MeasureLandscapeProps> = ({ measure, histories, geodesicPath }) => {
  const points: Point[] = useMemo(() => {
    const totalWeight = Array.from(measure.weights.values()).reduce((a, b) => a + b, 0);
    return histories.map(history => {
      const weight = measure.weights.get(JSON.stringify(history)) || 0;
      const normWeight = totalWeight > 0 ? weight / totalWeight : 0;
      const k = kappa(history);
      const patterns = activePatterns(history);
      const avgPhi = patterns.length > 0 ? patterns.reduce((sum, p) => sum + integratedInformation(p), 0) / patterns.length : 0;
      return {
        x: k - 0.5,
        z: avgPhi - 0.5,
        y: Math.pow(normWeight, 0.5) * 1.5,
        history,
      };
    });
  }, [measure, histories]);

  const geodesicPoints3D = geodesicPath?.map(p => ({ x: p.x, z: p.z, y: p.y })) || [];

  return (
    <div style={{ height: 320, width: '100%', background: '#1a120b', borderRadius: 16, border: '1px solid #b45309' }}>
      <Canvas camera={{ position: [2, 1.5, 2], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 5, 2]} intensity={0.8} />
        <LandscapeMesh points={points} geodesicPoints={geodesicPoints3D} />
        <OrbitControls enableZoom enablePan enableRotate />
        <axesHelper args={[1.5]} />
        <Text position={[1.2, -0.5, 0]} fontSize={0.15} color="#d4a373">κ</Text>
        <Text position={[0, -0.5, 1.2]} fontSize={0.15} color="#d4a373">Φ</Text>
        <Text position={[0, 1.2, 0]} fontSize={0.12} color="#e8b87a">вес</Text>
      </Canvas>
    </div>
  );
};
