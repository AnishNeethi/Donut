import React, { useRef, useMemo } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'

const Donut = ({ position = [0, 0, 0] }) => {
  const donutRef = useRef()
  
  // Create random initial rotation for variety in falling
  const initialRotation = useMemo(() => [
    Math.random() * Math.PI * 0.5, // Small random tilt
    Math.random() * Math.PI * 2,   // Random Y rotation
    Math.random() * Math.PI * 0.5  // Small random tilt
  ], [])

  return (
    <RigidBody 
      position={position}
      rotation={initialRotation}
      type="dynamic"
      restitution={0.15} // Very low bounce - donuts are soft
      friction={0.95} // Very high friction to prevent sliding
      linearDamping={0.6} // Strong air resistance to slow down
      angularDamping={0.8} // Strong rotational damping to stop spinning quickly
      mass={0.8} // Reasonable mass for a donut
    >
      {/* Custom collider that matches donut shape better */}
      <CuboidCollider args={[0.5, 0.3, 0.5]} />
      
      <group ref={donutRef}>
        {/* Main donut base */}
        <mesh castShadow receiveShadow>
          <torusGeometry args={[0.5, 0.3, 16, 32]} />
          <meshStandardMaterial 
            color="#DEB887" // Burlywood - more realistic donut color
            roughness={0.8}
            metalness={0.02}
          />
        </mesh>
        
        {/* White glaze layer - same shape as donut base */}
        <mesh castShadow receiveShadow position={[0, 0, 0.05]}>
          <torusGeometry args={[0.53, 0.29, 16.1, 32.1]} />
          <meshStandardMaterial 
            color="#FFFFFF" // Pure white glaze
            roughness={0.05}
            metalness={0.2}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      </group>
    </RigidBody>
  )
}



export default Donut 