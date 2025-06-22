import React, { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics, RigidBody } from '@react-three/rapier'
import { OrbitControls, Environment } from '@react-three/drei'
import Donut from './Donut'

const DonutScene = ({ sugarCount = 0 }) => {
  const [donuts, setDonuts] = useState([])

  useEffect(() => {
    // Create donuts based on sugar count (e.g., 1 donut per 10g of sugar)
    const donutsToSpawn = Math.ceil(sugarCount / 10)
    const newDonuts = []
    
    for (let i = 0; i < donutsToSpawn; i++) {
      newDonuts.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 4, // Random X position
          5 + i * 0.5, // Staggered height
          (Math.random() - 0.5) * 4  // Random Z position
        ]
      })
    }
    
    setDonuts(newDonuts)
  }, [sugarCount])

  return (
    <div className="donut-scene" style={{ width: '100%', height: '100vh' }}>
      <Canvas camera={{ position: [0, 5, 8], fov: 45 }}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight
          position={[0, 15, 0]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          castShadow
        />

        {/* Environment for better reflections */}
        <Environment preset="sunset" />

        {/* Camera controls */}
        <OrbitControls enablePan={false} enableZoom={false} />

        {/* Physics world */}
        <Physics>
          {/* Ground plane */}
          <Ground />
          
          {/* Spawn donuts */}
          {donuts.map((donut) => (
            <Donut key={donut.id} position={donut.position} />
          ))}
        </Physics>
      </Canvas>
    
    </div>
  )
}

// Ground component with physics
const Ground = () => {
  return (
    <RigidBody type="fixed">
      <mesh receiveShadow position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#FFB6C1" />
      </mesh>
    </RigidBody>
  )
}

export default DonutScene 