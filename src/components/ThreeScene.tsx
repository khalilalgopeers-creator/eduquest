import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

function FloatingShape({ position, color, type }: { position: [number, number, number], color: string, type: 'sphere' | 'box' | 'torus' }) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.cos(t / 4) / 2;
    meshRef.current.rotation.y = Math.sin(t / 4) / 2;
    meshRef.current.position.y = position[1] + Math.sin(t / 2) / 2;
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh ref={meshRef} position={position}>
        {type === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
        {type === 'box' && <boxGeometry args={[1.5, 1.5, 1.5]} />}
        {type === 'torus' && <torusGeometry args={[1, 0.4, 16, 100]} />}
        <MeshDistortMaterial color={color} speed={2} distort={0.3} radius={1} />
      </mesh>
    </Float>
  );
}

export default function ThreeScene() {
  return (
    <div className="fixed inset-0 -z-10 bg-slate-950">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        
        <FloatingShape position={[-4, 2, -2]} color="#3b82f6" type="sphere" />
        <FloatingShape position={[4, -2, -3]} color="#8b5cf6" type="box" />
        <FloatingShape position={[-2, -4, -1]} color="#10b981" type="torus" />
        <FloatingShape position={[5, 3, -5]} color="#f59e0b" type="sphere" />
        
        <mesh position={[0, 0, -10]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#020617" />
        </mesh>
      </Canvas>
    </div>
  );
}
