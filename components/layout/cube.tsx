import React, { useRef, useState, useMemo, ReactNode } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Text, OrbitControls } from '@react-three/drei';
import { DoubleSide, Mesh, Group } from 'three';

// Type definitions
interface Face {
  name: string;
  color: string;
  path: string;
}

interface CubeFaceProps {
  face: Face;
  position: [number, number, number];
  rotation: [number, number, number];
  onNavigate: (path: string, name: string) => void;
  isHovered: boolean;
  onHover: (index: number | null) => void;
  index: number;
}

interface RotatingCubeProps {
  faces: Face[];
  onNavigate: (path: string, name: string) => void;
  cubeSize: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
  wireframeColor: string;
  wireframeOpacity: number;
}

interface CubeNavigationProps {
  faces?: Face[];
  onNavigate?: (path: string, name: string) => void;
  cubeSize?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  backgroundColor?: string;
  wireframeColor?: string;
  wireframeOpacity?: number;
  enableOrbitControls?: boolean;
  enableDamping?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  className?: string;
  style?: React.CSSProperties;
  cameraPosition?: [number, number, number];
  ambientLightIntensity?: number;
  directionalLightIntensity?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface FaceConfig {
  position: [number, number, number];
  rotation: [number, number, number];
}

// Individual face component
const CubeFace: React.FC<CubeFaceProps> = ({ 
  face, 
  position, 
  rotation, 
  onNavigate, 
  isHovered, 
  onHover, 
  index 
}) => {
  const meshRef = useRef<Mesh>(null);
  const textRef = useRef<Mesh>(null);
  
  // Animate hover effect
  useFrame(() => {
    if (textRef.current) {
      const targetScale = isHovered ? 1.1 : 1;
      textRef.current.scale.lerp(
        { x: targetScale, y: targetScale, z: targetScale }, 
        0.1
      );
    }
  });

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onNavigate(face.path, face.name);
  };

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(index);
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(null);
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Invisible clickable plane */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial transparent opacity={0} side={DoubleSide} />
      </mesh>
      
      {/* Text label */}
      <Text
        ref={textRef}
        position={[0, 0, 0.01]}
        fontSize={0.3}
        color={face.color}
        anchorX="center"
        anchorY="middle"
 // You can add custom fonts to public/fonts/
        outlineWidth={0.02}
        outlineColor="#000000"
        outlineOpacity={0.3}
      >
        {face.name}
      </Text>
    </group>
  );
};

// Main cube component
const RotatingCube: React.FC<RotatingCubeProps> = ({ 
  faces, 
  onNavigate, 
  cubeSize, 
  autoRotate, 
  autoRotateSpeed,
  wireframeColor,
  wireframeOpacity 
}) => {
  const cubeRef = useRef<Group>(null);
  const [hoveredFace, setHoveredFace] = useState<number | null>(null);
  const { gl } = useThree();

  // Face configurations
  const faceConfigs = useMemo<FaceConfig[]>(() => [
    { position: [0, 0, cubeSize / 2], rotation: [0, 0, 0] }, // Front
    { position: [0, 0, -cubeSize / 2], rotation: [0, Math.PI, 0] }, // Back
    { position: [cubeSize / 2, 0, 0], rotation: [0, Math.PI / 2, 0] }, // Right
    { position: [-cubeSize / 2, 0, 0], rotation: [0, -Math.PI / 2, 0] }, // Left
    { position: [0, cubeSize / 2, 0], rotation: [-Math.PI / 2, 0, 0] }, // Top
    { position: [0, -cubeSize / 2, 0], rotation: [Math.PI / 2, 0, Math.PI] } // Bottom
  ], [cubeSize]);

  // Auto rotation
  useFrame(() => {
    if (autoRotate && cubeRef.current) {
      cubeRef.current.rotation.y += autoRotateSpeed;
      cubeRef.current.rotation.x += autoRotateSpeed * 0.4;
    }
  });

  // Update cursor based on hover state
  React.useEffect(() => {
    if (gl?.domElement) {
      gl.domElement.style.cursor = hoveredFace !== null ? 'pointer' : 'grab';
    }
  }, [hoveredFace, gl]);

  return (
    <group ref={cubeRef}>
      {/* Wireframe cube */}
      <mesh>
        <boxGeometry args={[cubeSize, cubeSize, cubeSize]} />
        <meshBasicMaterial 
          color={wireframeColor} 
          wireframe 
          transparent 
          opacity={wireframeOpacity} 
        />
      </mesh>

      {/* Face components */}
      {faces.slice(0, 6).map((face: Face, index: number) => {
        const config = faceConfigs[index];
        if (!config) return null;
        
        return (
          <CubeFace
            key={`${face.name}-${index}`}
            face={face}
            position={config.position}
            rotation={config.rotation}
            onNavigate={onNavigate}
            isHovered={hoveredFace === index}
            onHover={setHoveredFace}
            index={index}
          />
        );
      })}
    </group>
  );
};

// Loading fallback component
const LoadingCube: React.FC = () => (
  <div className="flex items-center justify-center w-full h-full">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
  </div>
);

// Error boundary for Three.js errors
class CubeErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Cube navigation error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center w-full h-full text-white">
          <div className="text-center">
            <p className="text-lg mb-2">Unable to load 3D navigation</p>
            <p className="text-sm text-gray-400">WebGL might not be supported</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main component with optimizations
const OptimizedCubeNavigation: React.FC<CubeNavigationProps> = ({
  faces = [
    { name: 'Home', color: '#60A5FA', path: '/' },
    { name: 'About', color: '#34D399', path: '/about' },
    { name: 'Projects', color: '#A78BFA', path: '/projects' },
    { name: 'Contact', color: '#F87171', path: '/contact' },
    { name: 'Blog', color: '#FBBF24', path: '/blog' },
    { name: 'Services', color: '#F472B6', path: '/services' }
  ],
  onNavigate = (path: string, name: string) => {
    console.log(`Navigating to: ${path}`);
    alert(`Navigation to ${name} (${path})`);
  },
  cubeSize = 2,
  autoRotate = true,
  autoRotateSpeed = 0.005,
  backgroundColor = '#111827',
  wireframeColor = '#ffffff',
  wireframeOpacity = 0.8,
  enableOrbitControls = true,
  enableDamping = true,
  enableZoom = false,
  enablePan = false,
  className = "w-full h-full",
  style = {},
  cameraPosition = [0, 0, 5] as [number, number, number],
  ambientLightIntensity = 0.6,
  directionalLightIntensity = 0.8
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Memoize face data to prevent unnecessary re-renders
  const memoizedFaces = useMemo<Face[]>(() => faces, [faces]);

  const handleCreated = (): void => {
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`} style={style}>
      <CubeErrorBoundary>
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-gray-900 bg-opacity-75">
            <LoadingCube />
          </div>
        )}
        
        <Canvas
          camera={{ position: cameraPosition, fov: 75 }}
          onCreated={handleCreated}
          className="cursor-grab active:cursor-grabbing"
          gl={{ 
            antialias: true, 
            alpha: false,
            powerPreference: "high-performance"
          }}
        >
          {/* Background */}
          <color attach="background" args={[backgroundColor]} />
          
          {/* Lighting */}
          <ambientLight intensity={ambientLightIntensity} />
          <directionalLight 
            position={[1, 1, 1]} 
            intensity={directionalLightIntensity} 
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          
          {/* Controls */}
          {enableOrbitControls && (
            <OrbitControls
              enableDamping={enableDamping}
              dampingFactor={0.05}
              enableZoom={enableZoom}
              enablePan={enablePan}
              minDistance={3}
              maxDistance={10}
              autoRotate={false} // We handle auto-rotation manually
            />
          )}
          
          {/* Main cube */}
          <RotatingCube
            faces={memoizedFaces}
            onNavigate={onNavigate}
            cubeSize={cubeSize}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            wireframeColor={wireframeColor}
            wireframeOpacity={wireframeOpacity}
          />
        </Canvas>
      </CubeErrorBoundary>
    </div>
  );
};

// Demo component showing usage
const CubeNavigationDemo: React.FC = () => {
  const handleNavigation = (path: string, name: string): void => {
    console.log(`Navigating to ${name}: ${path}`);
    // In Next.js: router.push(path);
    alert(`Would navigate to ${name} (${path})`);
  };

  const navigationFaces: Face[] = [
    { name: 'Dashboard', color: '#3B82F6', path: '/dashboard' },
    { name: 'Analytics', color: '#10B981', path: '/analytics' },
    { name: 'Projects', color: '#8B5CF6', path: '/projects' },
    { name: 'Settings', color: '#EF4444', path: '/settings' },
    { name: 'Profile', color: '#F59E0B', path: '/profile' },
    { name: 'Help', color: '#EC4899', path: '/help' }
  ];

  return (
    <div className="w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex-1 h-100">

        <OptimizedCubeNavigation
          faces={navigationFaces}
          onNavigate={handleNavigation}
          cubeSize={2.2}
          autoRotate={true}
          autoRotateSpeed={0.008}
          backgroundColor="#0F172A"
          wireframeColor="#64748B"
          wireframeOpacity={0.6}
          //className="w-full h-96 rounded-xl border border-gray-700 overflow-hidden shadow-2xl"
          enableZoom={true}
          cameraPosition={[0, 0, 6]}
        />
    </div>
  );
};

export default CubeNavigationDemo;