import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, Environment, Text, useTexture, Sphere, Box, Cylinder } from '@react-three/drei'
import * as THREE from 'three'

// Smooth Camera Controller
const CameraController = ({ scrollProgress }) => {
  const { camera } = useThree()
  const targetLookAtRef = useRef(new THREE.Vector3(0, 0, 0))
  
  useFrame(() => {
    // Define camera positions for each page - all at consistent distance with much more spacing
    const positions = [
      { pos: [0, 0, 25], lookAt: [0, 0, 0] },         // Page 1: Front view
      { pos: [80, 0, 25], lookAt: [80, 0, 0] },       // Page 2: Right side  
      { pos: [0, 80, 25], lookAt: [0, 80, 0] },       // Page 3: Top view
      { pos: [-80, 0, 25], lookAt: [-80, 0, 0] }      // Page 4: Left side
    ]
    
    // Calculate which page we're on with much smoother transitions
    const totalPages = 3 // 0 to 3 = 4 pages, but 3 transitions
    const pageProgress = scrollProgress * totalPages
    const pageIndex = Math.floor(pageProgress)
    const pageFactor = pageProgress % 1
    
    // Better easing function - smoother and more natural
    const easeInOutQuart = (t) => {
      return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
    }
    const smoothFactor = easeInOutQuart(pageFactor)
    
    const currentPage = positions[pageIndex] || positions[0]
    const nextPage = positions[pageIndex + 1] || positions[3]
    
    // Create curved camera paths instead of straight lines
    let targetPos, targetLookAt
    
    if (pageIndex === 0) {
      // Page 1 to Page 2 - Arc to the right
      const midPoint = new THREE.Vector3(40, 15, 35)
      targetPos = new THREE.Vector3()
      targetPos.lerpVectors(
        new THREE.Vector3().lerpVectors(new THREE.Vector3(...currentPage.pos), midPoint, smoothFactor),
        new THREE.Vector3().lerpVectors(midPoint, new THREE.Vector3(...nextPage.pos), smoothFactor),
        smoothFactor
      )
      
      targetLookAt = new THREE.Vector3(
        THREE.MathUtils.lerp(currentPage.lookAt[0], nextPage.lookAt[0], smoothFactor),
        THREE.MathUtils.lerp(currentPage.lookAt[1], nextPage.lookAt[1], smoothFactor),
        THREE.MathUtils.lerp(currentPage.lookAt[2], nextPage.lookAt[2], smoothFactor)
      )
    } else if (pageIndex === 1) {
      // Page 2 to Page 3 - Arc upward
      const midPoint = new THREE.Vector3(40, 40, 35)
      targetPos = new THREE.Vector3()
      targetPos.lerpVectors(
        new THREE.Vector3().lerpVectors(new THREE.Vector3(...currentPage.pos), midPoint, smoothFactor),
        new THREE.Vector3().lerpVectors(midPoint, new THREE.Vector3(...nextPage.pos), smoothFactor),
        smoothFactor
      )
      
      targetLookAt = new THREE.Vector3(
        THREE.MathUtils.lerp(currentPage.lookAt[0], nextPage.lookAt[0], smoothFactor),
        THREE.MathUtils.lerp(currentPage.lookAt[1], nextPage.lookAt[1], smoothFactor),
        THREE.MathUtils.lerp(currentPage.lookAt[2], nextPage.lookAt[2], smoothFactor)
      )
    } else if (pageIndex === 2) {
      // Page 3 to Page 4 - Wide arc to the left
      const midPoint = new THREE.Vector3(-40, 40, 35)
      targetPos = new THREE.Vector3()
      targetPos.lerpVectors(
        new THREE.Vector3().lerpVectors(new THREE.Vector3(...currentPage.pos), midPoint, smoothFactor),
        new THREE.Vector3().lerpVectors(midPoint, new THREE.Vector3(...nextPage.pos), smoothFactor),
        smoothFactor
      )
      
      targetLookAt = new THREE.Vector3(
        THREE.MathUtils.lerp(currentPage.lookAt[0], nextPage.lookAt[0], smoothFactor),
        THREE.MathUtils.lerp(currentPage.lookAt[1], nextPage.lookAt[1], smoothFactor),
        THREE.MathUtils.lerp(currentPage.lookAt[2], nextPage.lookAt[2], smoothFactor)
      )
    } else {
      // Default straight interpolation
      targetPos = new THREE.Vector3(
        THREE.MathUtils.lerp(currentPage.pos[0], nextPage.pos[0], smoothFactor),
        THREE.MathUtils.lerp(currentPage.pos[1], nextPage.pos[1], smoothFactor),
        THREE.MathUtils.lerp(currentPage.pos[2], nextPage.pos[2], smoothFactor)
      )
      
      targetLookAt = new THREE.Vector3(
        THREE.MathUtils.lerp(currentPage.lookAt[0], nextPage.lookAt[0], smoothFactor),
        THREE.MathUtils.lerp(currentPage.lookAt[1], nextPage.lookAt[1], smoothFactor),
        THREE.MathUtils.lerp(currentPage.lookAt[2], nextPage.lookAt[2], smoothFactor)
      )
    }
    
    // Much more responsive camera movement with smooth rotation
    camera.position.lerp(targetPos, 0.12)
    
    // Smooth lookAt interpolation
    targetLookAtRef.current.lerp(targetLookAt, 0.1)
    camera.lookAt(targetLookAtRef.current)
    
    // Add subtle camera shake for dynamism during transitions
    if (pageFactor > 0.1 && pageFactor < 0.9) {
      const shake = Math.sin(Date.now() * 0.01) * 0.1 * (1 - Math.abs(pageFactor - 0.5) * 2)
      camera.position.y += shake
    }
    
    // Dynamic FOV for cinematic effect during transitions
    const baseFOV = 75
    const transitionIntensity = Math.sin(pageFactor * Math.PI)
    camera.fov = baseFOV + (transitionIntensity * 5)
    camera.updateProjectionMatrix()
  })
  
  return null
}

// Minimal Ambient Particles Component
const AmbientParticles = ({ scrollProgress }) => {
  const particlesRef = useRef()
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02
    }
  })
  
  return (
    <group ref={particlesRef}>
      {[...Array(3)].map((_, i) => {
        const orbitRadius = 80 + i * 40
        const angle = (i / 3) * Math.PI * 2
        const time = Date.now() * 0.001
        const animatedAngle = angle + time * 0.01
        
        return (
          <mesh
            key={i}
            position={[
              Math.cos(animatedAngle) * orbitRadius,
              Math.sin(animatedAngle) * orbitRadius * 0.3,
              Math.sin(animatedAngle * 0.5) * 20
            ]}
          >
            <sphereGeometry args={[0.3]} />
            <meshBasicMaterial
              color="#4a5568"
              transparent
              opacity={0.2}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// Clean Background Particles
const AnimatedParticles = ({ scrollProgress }) => {
  const particlesRef = useRef()
  
  const particleCount = 120
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 200
      pos[i * 3 + 1] = (Math.random() - 0.5) * 200  
      pos[i * 3 + 2] = (Math.random() - 0.5) * 100  
    }
    return pos
  }, [])
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.015
    }
  })
  
  return (
    <>
      {/* Single clean particle layer */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial 
          color="#64748b"
          size={0.03}
          transparent
          opacity={0.4}
          sizeAttenuation
        />
      </points>
      
      {/* Minimal ambient particles */}
      <AmbientParticles scrollProgress={scrollProgress} />
    </>
  )
}

// Page 1: Welcome/Hero Section
const Page1 = ({ scrollProgress }) => {
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2
    }
  })
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main display screen with rounded corners */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial 
          color="#1a1a2e"
          transparent
          opacity={0.9}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      
      {/* Multi-layer glowing frame for depth */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[12.3, 8.3]} />
        <meshBasicMaterial 
          color="#00ffff"
          transparent
          opacity={0.15}
        />
      </mesh>
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[12.6, 8.6]} />
        <meshBasicMaterial 
          color="#00ffff"
          transparent
          opacity={0.08}
        />
      </mesh>
      
      {/* Floating geometric shapes */}
      <Box args={[0.5, 0.5, 0.5]} position={[-6, 4, 1]}>
        <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={0.2} />
      </Box>
      <Sphere args={[0.3]} position={[6, 4, 1]}>
        <meshStandardMaterial color="#4ecdc4" emissive="#4ecdc4" emissiveIntensity={0.2} />
      </Sphere>
      <Cylinder args={[0.2, 0.2, 0.8]} position={[0, 5, 1]}>
        <meshStandardMaterial color="#ffe66d" emissive="#ffe66d" emissiveIntensity={0.2} />
      </Cylinder>
      
      <Html 
        position={[0, 0, 0.1]} 
        center
        style={{ 
          width: '1200px', 
          height: '800px', 
          pointerEvents: 'none'
        }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(26,26,46,0.95) 0%, rgba(16,16,35,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          color: 'white',
          fontFamily: '"SF Pro Display", system-ui, sans-serif',
          textAlign: 'center',
          padding: '50px',
          borderRadius: '30px',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
          <h1 style={{
            fontSize: '4rem',
            fontWeight: '700',
            marginBottom: '2rem',
            background: 'linear-gradient(45deg, #00ffff, #ff6b6b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            FUTURE WEB
          </h1>
          <p style={{
            fontSize: '1.5rem',
            marginBottom: '3rem',
            opacity: 0.9,
            maxWidth: '600px',
            lineHeight: '1.6'
          }}>
            Experience the next generation of web development with immersive 3D interfaces
          </p>
          <div style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, rgba(0, 200, 255, 0.1) 100%)',
            border: '2px solid transparent',
            borderImage: 'linear-gradient(45deg, #00ffff, #00d4ff) 1',
            borderRadius: '50px',
            color: '#00ffff',
            fontWeight: '600',
            fontSize: '1.1rem',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
            Scroll to Explore
          </div>
        </div>
      </Html>
    </group>
  )
}

// Page 2: About/Features
const Page2 = ({ scrollProgress }) => {
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.05
    }
  })

  return (
    <group ref={groupRef} position={[80, 0, 0]}>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial 
          color="#2d1b69"
          transparent
          opacity={0.9}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>
      
      {/* Multi-layer frame for Page 2 */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[12.3, 8.3]} />
        <meshBasicMaterial 
          color="#ff6b6b"
          transparent
          opacity={0.15}
        />
      </mesh>
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[12.6, 8.6]} />
        <meshBasicMaterial 
          color="#ff6b6b"
          transparent 
          opacity={0.08}
        />
      </mesh>
      
      {/* Animated rings - adjusted for smaller page */}
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[0, 0, -0.3 + i * 0.1]} rotation={[0, 0, 0]}>
          <ringGeometry args={[1.5 + i * 0.4, 1.6 + i * 0.4, 32]} />
          <meshBasicMaterial 
            color="#ff6b6b" 
            transparent 
            opacity={0.4 - i * 0.06}
            side={THREE.DoubleSide}
        />
        </mesh>
      ))}

        <Html
        position={[0, 0, 0.1]} 
        center
          style={{
          width: '1200px', 
          height: '800px', 
          pointerEvents: 'none'
        }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(45,27,105,0.95) 0%, rgba(25,15,60,0.95) 100%)',
          backdropFilter: 'blur(20px)',
            color: 'white',
          fontFamily: '"SF Pro Display", system-ui, sans-serif',
          padding: '50px',
          borderRadius: '30px',
          border: '1px solid rgba(255, 107, 107, 0.3)',
          boxShadow: '0 25px 50px rgba(255, 50, 50, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '2rem',
            color: '#ff6b6b'
          }}>
            Revolutionary Features
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '2rem',
            maxWidth: '800px'
          }}>
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.15) 0%, rgba(255, 50, 50, 0.1) 100%)',
              borderRadius: '25px',
              border: '1px solid rgba(255, 107, 107, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(255, 107, 107, 0.2)'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ff6b6b' }}>3D Immersion</h3>
              <p style={{ opacity: 0.9 }}>Full 3D environments with smooth camera transitions</p>
              </div>
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.15) 0%, rgba(50, 150, 130, 0.1) 100%)',
                  borderRadius: '25px',
              border: '1px solid rgba(78, 205, 196, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(78, 205, 196, 0.2)'
                }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#4ecdc4' }}>Scroll Animation</h3>
              <p style={{ opacity: 0.9 }}>Camera movements synchronized with scroll</p>
              </div>
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(255, 230, 109, 0.15) 0%, rgba(255, 200, 50, 0.1) 100%)',
              borderRadius: '25px',
              border: '1px solid rgba(255, 230, 109, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(255, 230, 109, 0.2)'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ffe66d' }}>Performance</h3>
              <p style={{ opacity: 0.9 }}>Optimized for 60fps on all devices</p>
            </div>
            <div style={{
              padding: '2rem',
              background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.15) 0%, rgba(0, 200, 200, 0.1) 100%)',
              borderRadius: '25px',
              border: '1px solid rgba(0, 255, 255, 0.4)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 255, 255, 0.2)'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#00ffff' }}>Interactive</h3>
              <p style={{ opacity: 0.9 }}>Respond to user interactions in real-time</p>
              </div>
            </div>
          </div>
        </Html>
    </group>
  )
}

// Page 3: Services/Portfolio
const Page3 = ({ scrollProgress }) => {
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    }
  })
  
  return (
    <group ref={groupRef} position={[0, 80, 0]}>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial 
          color="#16213e"
          transparent
          opacity={0.9}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Multi-layer frame for Page 3 */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[12.3, 8.3]} />
        <meshBasicMaterial 
          color="#4ecdc4"
          transparent
          opacity={0.15}
        />
      </mesh>
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[12.6, 8.6]} />
        <meshBasicMaterial 
          color="#4ecdc4"
          transparent
          opacity={0.08}
        />
      </mesh>
      
      {/* Floating cubes grid - adjusted for smaller page */}
      {[...Array(12)].map((_, i) => {
        const x = (i % 3 - 1) * 1.8
        const y = (Math.floor(i / 3) - 1.5) * 1.2
        return (
          <Box key={i} args={[0.25, 0.25, 0.25]} position={[x, y, 1]}>
            <meshStandardMaterial 
              color={`hsl(${i * 25}, 70%, 60%)`} 
              emissive={`hsl(${i * 25}, 70%, 30%)`}
              emissiveIntensity={0.3}
            />
          </Box>
        )
      })}
      
      <Html 
        position={[0, 0, 0.1]} 
        center
        style={{ 
          width: '1200px', 
          height: '800px', 
          pointerEvents: 'none'
        }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(22,33,62,0.95) 0%, rgba(15,25,45,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          color: 'white',
          fontFamily: '"SF Pro Display", system-ui, sans-serif',
          padding: '50px',
          borderRadius: '30px',
          border: '1px solid rgba(78, 205, 196, 0.3)',
          boxShadow: '0 25px 50px rgba(0, 150, 150, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '2rem',
            color: '#4ecdc4'
          }}>
            Our Services
          </h2>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            maxWidth: '700px',
            width: '100%'
          }}>
            {[
              { title: 'Web Development', desc: 'Cutting-edge websites with 3D capabilities' },
              { title: 'UI/UX Design', desc: 'Immersive user experiences in 3D space' },
              { title: 'Animation', desc: 'Smooth scroll-based animations and transitions' },
              { title: 'Optimization', desc: 'Performance tuning for complex 3D scenes' }
            ].map((service, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem 2rem',
                background: `linear-gradient(135deg, rgba(${i * 40 + 78}, ${i * 30 + 205}, ${i * 35 + 196}, 0.15) 0%, rgba(${i * 25 + 50}, ${i * 20 + 150}, ${i * 25 + 130}, 0.1) 100%)`,
                borderRadius: '20px',
                border: `1px solid rgba(${i * 40 + 78}, ${i * 30 + 205}, ${i * 35 + 196}, 0.4)`,
                backdropFilter: 'blur(10px)',
                boxShadow: `0 8px 32px rgba(${i * 40 + 78}, ${i * 30 + 205}, ${i * 35 + 196}, 0.2)`
              }}>
                <div>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: `hsl(${i * 30 + 180}, 70%, 70%)` }}>{service.title}</h3>
                  <p style={{ opacity: 0.8 }}>{service.desc}</p>
                </div>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: `linear-gradient(45deg, hsl(${i * 30 + 180}, 80%, 50%), hsl(${i * 30 + 200}, 80%, 60%))`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  boxShadow: `0 4px 16px rgba(${i * 40 + 78}, ${i * 30 + 205}, ${i * 35 + 196}, 0.3)`
                }}>
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Html>
    </group>
  )
}

// Page 4: Contact
const Page4 = ({ scrollProgress }) => {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.15
    }
  })

  return (
    <group ref={groupRef} position={[-80, 0, 0]}>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial 
          color="#0f3460"
          transparent
          opacity={0.9}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Multi-layer frame for Page 4 */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[12.3, 8.3]} />
        <meshBasicMaterial 
          color="#ffe66d"
          transparent
          opacity={0.15}
        />
      </mesh>
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[12.6, 8.6]} />
        <meshBasicMaterial 
          color="#ffe66d"
          transparent
          opacity={0.08}
        />
      </mesh>
      
      {/* Spiral particles - adjusted for smaller page */}
      {[...Array(25)].map((_, i) => {
        const angle = (i / 25) * Math.PI * 3.5
        const radius = 2.5 + i * 0.08
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        const z = (i - 12) * 0.08
        
        return (
          <Sphere key={i} args={[0.04]} position={[x, y, z]}>
            <meshBasicMaterial 
              color={`hsl(${i * 14}, 80%, 70%)`}
        transparent 
              opacity={0.8}
            />
          </Sphere>
        )
      })}
      
      <Html 
        position={[0, 0, 0.1]} 
        center
        style={{ 
          width: '1200px', 
          height: '800px', 
          pointerEvents: 'auto'
        }}
      >
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(15,52,96,0.95) 0%, rgba(10,35,65,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          color: 'white',
          fontFamily: '"SF Pro Display", system-ui, sans-serif',
          padding: '50px',
          borderRadius: '30px',
          border: '1px solid rgba(255, 230, 109, 0.3)',
          boxShadow: '0 25px 50px rgba(255, 200, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '2rem',
            color: '#ffe66d'
          }}>
            Get In Touch
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3rem',
            maxWidth: '900px',
            width: '100%'
          }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#4ecdc4' }}>Contact Info</h3>
              <div style={{ fontSize: '1.1rem', lineHeight: '2' }}>
                <p>📧 hello@futureweb.dev</p>
                <p>📱 +1 (555) 123-4567</p>
                <p>🌐 www.futureweb.dev</p>
                <p>📍 San Francisco, CA</p>
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ff6b6b' }}>Quick Message</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="Your Name"
                  style={{
                    padding: '1rem',
                    borderRadius: '15px',
                    border: '1px solid rgba(255, 230, 109, 0.4)',
                    background: 'rgba(255, 230, 109, 0.1)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    fontSize: '1rem',
                    boxShadow: '0 4px 16px rgba(255, 230, 109, 0.2)'
                  }}
      />
                <input 
                  type="email" 
                  placeholder="Your Email"
                  style={{
                    padding: '1rem',
                    borderRadius: '15px',
                    border: '1px solid rgba(255, 230, 109, 0.4)',
                    background: 'rgba(255, 230, 109, 0.1)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    fontSize: '1rem',
                    boxShadow: '0 4px 16px rgba(255, 230, 109, 0.2)'
                  }}
                />
                <button style={{
                  padding: '1rem 2rem',
                  borderRadius: '25px',
                  border: '2px solid transparent',
                  borderImage: 'linear-gradient(45deg, #ffe66d, #ffb347) 1',
                  background: 'linear-gradient(135deg, rgba(255, 230, 109, 0.15) 0%, rgba(255, 179, 71, 0.1) 100%)',
                  backdropFilter: 'blur(10px)',
                  color: '#ffe66d',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 32px rgba(255, 230, 109, 0.3)'
                }}>
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  )
}

// Main Component
const FuturisticWebsite = () => {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      const progress = Math.min(scrollTop / Math.max(documentHeight, 1), 1)
      setScrollProgress(progress)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Check on mount
    checkMobile()
    
    // Listen for resize events
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      {/* Mobile Warning Overlay */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          padding: '2rem',
          color: 'white'
        }}>
          <div style={{
            maxWidth: '400px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '3rem 2rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              📱
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              marginBottom: '1rem',
              color: '#00ffff'
            }}>
              Mobile Not Supported
            </h2>
            <p style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1.5rem'
            }}>
              Sorry, this 3D website is not compatible with small screens. 
              Please visit on a desktop or tablet for the best experience.
            </p>
            <div style={{
              fontSize: '0.9rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Minimum width required: 768px
            </div>
          </div>
        </div>
      )}

      {/* Canvas for 3D scene */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw', 
          height: '100vh',
          zIndex: 1,
          display: isMobile ? 'none' : 'block'
      }}>
                 <Canvas
          camera={{ position: [0, 0, 25], fov: 75 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)' }}
        >
          <ambientLight intensity={0.4} />
          {/* Main area lighting */}
          <pointLight position={[0, 0, 20]} intensity={1.2} color="#00ffff" />
        
          {/* Page-specific lighting */}
          <pointLight position={[80, 0, 10]} intensity={0.8} color="#ff6b6b" />
          <pointLight position={[0, 80, 10]} intensity={0.8} color="#4ecdc4" />
          <pointLight position={[-80, 0, 10]} intensity={0.8} color="#ffe66d" />
        
          {/* Atmospheric lighting */}
          <spotLight position={[40, 40, 30]} intensity={0.6} color="#a855f7" angle={0.5} />
          <spotLight position={[-40, -40, 30]} intensity={0.6} color="#ec4899" angle={0.5} />

          <Environment preset="night" />
          
          <CameraController scrollProgress={scrollProgress} />
          <AnimatedParticles scrollProgress={scrollProgress} />

          <Page1 scrollProgress={scrollProgress} />
          <Page2 scrollProgress={scrollProgress} />
          <Page3 scrollProgress={scrollProgress} />
          <Page4 scrollProgress={scrollProgress} />
        </Canvas>
      </div>
      
      {/* Scroll content for height */}
      {!isMobile && (
        <div style={{ 
          height: '600vh', 
          position: 'relative', 
          zIndex: 2, 
          pointerEvents: 'none' 
        }} />
      )}
      
      {/* Progress indicator */}
      {!isMobile && (
        <div style={{
          position: 'fixed',
          top: '50%',
          right: '2rem',
          transform: 'translateY(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {[0, 1, 2, 3].map((page) => (
            <div
              key={page}
              style={{
                width: '4px',
                height: '40px',
                background: scrollProgress * 3 >= page ? '#00ffff' : 'rgba(255, 255, 255, 0.3)',
                borderRadius: '2px',
                transition: 'all 0.5s ease',
                boxShadow: scrollProgress * 3 >= page ? '0 0 10px #00ffff' : 'none'
              }}
            />
          ))}
        </div>
      )}

      {/* Scroll hint */}
      {!isMobile && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
          zIndex: 10,
              color: 'white',
          fontSize: '0.9rem',
          opacity: scrollProgress < 0.05 ? 1 : Math.max(0, 1 - scrollProgress * 10),
          transition: 'opacity 0.5s ease',
          textAlign: 'center'
          }}>
          <div style={{ marginBottom: '0.5rem' }}>Scroll to navigate</div>
          <div style={{ fontSize: '1.5rem', animation: 'bounce 2s infinite' }}>↓</div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          overflow-x: hidden;
          font-family: "SF Pro Display", system-ui, sans-serif;
        }
        
        input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }
        
        input:focus {
          outline: none;
          border-color: #00ffff;
          background: rgba(255, 255, 255, 0.15);
        }
        
        button:hover {
          background: rgba(255, 230, 109, 0.2);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}

export default FuturisticWebsite 