import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { Environment, OrthographicCamera } from '@react-three/drei';

// Adjustable scale factor - increase/decrease this value to change donut size
const DONUT_SCALE = 6;

// Helper component to calculate size based on screen
const ScreenSizeHelper = ({ children }) => {
  const { viewport } = useThree();
  const screenScale = Math.min(viewport.width, viewport.height) / 20; // Base scale on screen size
  const finalScale = screenScale * DONUT_SCALE; // Apply adjustable scale factor

  return (
    <group scale={[finalScale, finalScale, finalScale]}>
      {children}
    </group>
  );
};

// Single donut component with physics
const Donut = ({ position, onOutOfBounds }) => {
  const { viewport } = useThree();
  const screenScale = Math.min(viewport.width, viewport.height) / 20;
  const finalScale = screenScale * DONUT_SCALE;
  const rigidBodyRef = React.useRef();
  
  const randomRotation = [
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI * 2
  ];

  // Check position every frame
  useFrame(() => {
    onOutOfBounds(rigidBodyRef);
  });

  return (
    <RigidBody 
      ref={rigidBodyRef}
      position={[position[0], position[1], 0]}
      rotation={randomRotation}
      type="dynamic"
      restitution={0.5}
      friction={0.8}
      linearDamping={0.2}
      angularDamping={0.2}
      mass={0.16}
      colliders={false}
      scale={[finalScale, finalScale, finalScale]}
      lockTranslations={[false, false, true]}
      lockRotations={[false, false, true]}
    >
      {/* Larger collider to prevent clipping */}
      <CuboidCollider 
        args={[0.75, 0.75, 0.01]} // Much larger in X and Y
        position={[0, 0, 0]}
        restitution={0.5}
        friction={0.8}
        sensor={false}
      />
      <mesh castShadow>
        <torusGeometry args={[0.5, 0.25, 32, 32]} />
        <meshStandardMaterial 
          color="#DEB887"
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      <mesh castShadow position={[0, 0, 0.1]}>
        <torusGeometry args={[0.52, 0.22, 32, 32]} />
        <meshStandardMaterial 
          color="#4A90E2"
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
    </RigidBody>
  );
};



// Walls that match screen edges
const Walls = () => {
  const { viewport } = useThree();
  const halfWidth = viewport.width / 2;
  const halfHeight = viewport.height / 2;
  
  return (
    <RigidBody type="fixed" restitution={0.3} friction={0.5}>
      {/* Left wall - moved in slightly */}
      <mesh position={[-halfWidth + 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[viewport.height, viewport.height, 2]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
      {/* Right wall - moved in slightly */}
      <mesh position={[halfWidth - 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[viewport.height, viewport.height, 2]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
    </RigidBody>
  );
};

const DonutV2 = ({ sugarCount = 0 }) => {
  const [donuts, setDonuts] = useState([]);
  const donutCount = Math.ceil(sugarCount / 5);

  // Function to create a new donut with a position
  const createDonut = (index, xPos = null) => ({
    id: `donut-${Date.now()}-${index}`,
    position: [
      xPos ?? ((Math.random() - 0.5) * (window.innerWidth / 80)), // Keep X if provided, otherwise random
      25, // Always spawn at top
      0
    ]
  });

  // Initial spawn
  useEffect(() => {
    const newDonuts = Array.from({ length: donutCount }, (_, index) => createDonut(index));
    setDonuts(newDonuts);
  }, [donutCount]);

  // Check for donuts that need respawning
  const checkDonutPosition = (donutRef) => {
    if (donutRef.current) {
      const position = donutRef.current.translation();
      // If donut falls below screen, respawn it at the top with same X position
      if (position.y < -window.innerHeight / 20) { // Convert to scene units
        const newPosition = [position.x, 25, 0];
        donutRef.current.setTranslation(newPosition);
        donutRef.current.setLinvel({ x: 0, y: 0, z: 0 }); // Reset velocity
        donutRef.current.setAngvel({ x: 0, y: 0, z: 0 }); // Reset angular velocity
      }
    }
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      <Canvas 
        shadows 
        style={{ background: 'transparent' }}
        camera={{ position: [0, 0, 10], zoom: 40 }}
        orthographic
      >
        <OrthographicCamera 
          makeDefault 
          position={[0, 0, 10]} 
          zoom={40}
        />

        <ambientLight intensity={0.7} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        <Environment preset="sunset" />

        <Physics gravity={[0, -8, 0]}> {/* Moon gravity (about 1/6 of Earth's -50) */}
          <Walls />
          {donuts.map((donut) => (
            <Donut 
              key={donut.id} 
              position={donut.position}
              onOutOfBounds={checkDonutPosition}
            />
          ))}
        </Physics>
      </Canvas>

      <div style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '10px 20px',
        borderRadius: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 1000
      }}>
        <p style={{ margin: 0, fontSize: '1.2em', fontWeight: 'bold', color: '#333' }}>
          {sugarCount}g sugar = {donutCount} donuts
        </p>
      </div>
    </div>
  );
};

export default DonutV2; 