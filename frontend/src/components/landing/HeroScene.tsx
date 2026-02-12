import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Alchemy Circle
function AlchemyCircle() {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = state.clock.elapsedTime * 0.15;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <group ref={ref}>
      {/* Outer Ring */}
      <mesh>
        <torusGeometry args={[2.5, 0.03, 16, 100]} />
        <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={2} transparent opacity={0.8} />
      </mesh>

      {/* Inner Ring */}
      <mesh>
        <torusGeometry args={[1.8, 0.02, 16, 100]} />
        <meshStandardMaterial color="#A78BFA" emissive="#A78BFA" emissiveIntensity={1.5} transparent opacity={0.6} />
      </mesh>

      {/* Third Ring */}
      <mesh rotation={[Math.PI / 6, 0, 0]}>
        <torusGeometry args={[2.1, 0.02, 16, 100]} />
        <meshStandardMaterial color="#7C3AED" emissive="#7C3AED" emissiveIntensity={1.5} transparent opacity={0.5} />
      </mesh>

      {/* Triangle */}
      {[0, 1, 2].map((i) => {
        const angle = (i * Math.PI * 2) / 3 - Math.PI / 2;
        const nextAngle = ((i + 1) * Math.PI * 2) / 3 - Math.PI / 2;
        const x1 = Math.cos(angle) * 1.8;
        const y1 = Math.sin(angle) * 1.8;
        const x2 = Math.cos(nextAngle) * 1.8;
        const y2 = Math.sin(nextAngle) * 1.8;

        return (
          <line key={i}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array([x1, y1, 0, x2, y2, 0]), 3]}
                count={2}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#A78BFA" transparent opacity={0.6} />
          </line>
        );
      })}

      {/* Center Hex Point */}
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#A78BFA" emissive="#A78BFA" emissiveIntensity={3} />
      </mesh>

      {/* Rune Symbols (small spheres at vertices) */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * Math.PI * 2) / 6;
        return (
          <mesh key={`rune-${i}`} position={[Math.cos(angle) * 2.5, Math.sin(angle) * 2.5, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#8B5CF6" emissive="#8B5CF6" emissiveIntensity={4} />
          </mesh>
        );
      })}
    </group>
  );
}

// Orbiting Particles
function Particles({ count = 200 }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.random() * 3;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.05;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.03) * 0.1;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#A78BFA"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Energy Orbs
function EnergyOrbs() {
  const orbsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (orbsRef.current) {
      orbsRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={orbsRef}>
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI * 2) / 4;
        return (
          <Float key={i} speed={2} floatIntensity={0.5} rotationIntensity={0}>
            <mesh position={[Math.cos(angle) * 3.2, Math.sin(angle) * 0.5, Math.sin(angle) * 3.2]}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial
                color="#8B5CF6"
                emissive="#8B5CF6"
                emissiveIntensity={5}
                transparent
                opacity={0.9}
              />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

export const HeroScene: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <fog attach="fog" args={['#0B0F14', 5, 15]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 3]} color="#8B5CF6" intensity={2} distance={10} />
        <pointLight position={[3, 2, 0]} color="#7C3AED" intensity={1} distance={8} />
        <pointLight position={[-3, -2, 0]} color="#A78BFA" intensity={1} distance={8} />

        <Float speed={1.5} floatIntensity={0.3} rotationIntensity={0.1}>
          <AlchemyCircle />
        </Float>

        <Particles />
        <EnergyOrbs />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI / 1.8}
          minPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
    </div>
  );
};
