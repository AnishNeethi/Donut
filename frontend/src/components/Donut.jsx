import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { TorusGeometry } from 'three'

const Donut = ({ position = [0, 0, 0] }) => {
  const donutRef = useRef()

  // Optional: Add some rotation animation while falling
  useFrame((state) => {
    if (donutRef.current) {
      // Subtle rotation for visual appeal
      donutRef.current.rotation.x += 0.01
      donutRef.current.rotation.y += 0.005
    }
  })

  return (
    <RigidBody position={position} type="dynamic">
      <mesh ref={donutRef} castShadow receiveShadow>
        {/* Torus geometry to create donut shape */}
        <torusGeometry args={[0.6, 0.25, 8, 16]} />
        <meshStandardMaterial 
          color="#D2691E" 
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* Pink frosting layer */}
      <mesh castShadow receiveShadow position={[0, 0.02, 0]}>
        <torusGeometry args={[0.62, 0.22, 8, 16]} />
        <meshStandardMaterial 
          color="#FFB6C1" 
          roughness={0.2}
          metalness={0.05}
        />
      </mesh>
      
      {/* Sprinkles - small colorful cylinders */}
      <Sprinkles />
    </RigidBody>
  )
}

// Component for donut sprinkles
const Sprinkles = () => {
  const sprinkleColors = ['#FF69B4', '#00FF00', '#FFFF00', '#FF4500', '#8A2BE2']
  const sprinkles = []
  
  // Generate random sprinkles
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const radius = 0.3 + Math.random() * 0.3
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    
    sprinkles.push(
      <mesh 
        key={i}
        position={[x, 0.05, z]}
        rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
      >
        <cylinderGeometry args={[0.02, 0.02, 0.1]} />
        <meshStandardMaterial color={sprinkleColors[i % sprinkleColors.length]} />
      </mesh>
    )
  }
  
  return <>{sprinkles}</>
}

export default Donut 