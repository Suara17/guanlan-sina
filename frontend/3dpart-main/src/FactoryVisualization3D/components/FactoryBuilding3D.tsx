import React, { useRef, useState, useMemo } from 'react';
import { Box, Text, Html, Instance, Instances, Extrude } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Factory } from '../factoryData';
import { useFactoryStore } from '../store';
import * as THREE from 'three';

interface FactoryBuildingProps {
  factory: Factory;
  onClick?: () => void;
}

// --- Reusable Architectural Elements ---

// Roof Equipment (HVAC, Vents)
const RoofEquipment = ({ count = 5, areaSize = [10, 10] }: { count?: number, areaSize?: [number, number] }) => {
  const items = useMemo(() => {
    return [...Array(count)].map((_, i) => ({
      pos: [
        (Math.random() - 0.5) * areaSize[0],
        0,
        (Math.random() - 0.5) * areaSize[1]
      ] as [number, number, number],
      size: [
        0.5 + Math.random() * 1.5,
        0.5 + Math.random() * 0.8,
        0.5 + Math.random() * 1.5
      ] as [number, number, number],
      type: Math.random() > 0.5 ? 'ac' : 'vent'
    }));
  }, [count, areaSize]);

  return (
    <group>
      {items.map((item, i) => (
        <group key={i} position={item.pos}>
          {/* Unit Body */}
          <Box args={item.size} position={[0, item.size[1]/2, 0]}>
            <meshStandardMaterial color="#94a3b8" roughness={0.6} />
          </Box>
          {/* Fan detail for AC */}
          {item.type === 'ac' && (
            <Box args={[item.size[0]*0.8, 0.1, item.size[2]*0.8]} position={[0, item.size[1], 0]}>
               <meshStandardMaterial color="#475569" />
            </Box>
          )}
        </group>
      ))}
    </group>
  );
};

// Realistic Factory Hall with Siding and Parapet
const ModernFactoryHall = ({ position, size = [25, 8, 15] }: { position: [number, number, number], size?: [number, number, number] }) => {
  const [width, height, depth] = size;
  const wallThickness = 0.5;

  return (
    <group position={position}>
      {/* Concrete Base (Plinth) - Clean White/Grey */}
      <Box args={[width, 1.0, depth]} position={[0, 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
      </Box>

      {/* Main Walls (Dark Architectural Grey) */}
      <Box args={[width - 0.2, height - 1.0, depth - 0.2]} position={[0, 1.0 + (height - 1.0)/2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.2} />
      </Box>

      {/* Horizontal Strip Windows (Light Blue Glass) */}
      <Box args={[width + 0.1, 1.5, depth - 4]} position={[0, height - 2.5, 0]}>
        <meshPhysicalMaterial 
          color="#bae6fd" 
          metalness={0.8} 
          roughness={0.1} 
          transmission={0.2}
          transparent
          opacity={0.9}
        />
      </Box>

      {/* Roof Parapet (White/Silver Accent) */}
      <group position={[0, height, 0]}>
        <Box args={[width, 0.8, wallThickness]} position={[0, 0.4, depth/2 - wallThickness/2]}>
           <meshStandardMaterial color="#f1f5f9" />
        </Box>
        <Box args={[width, 0.8, wallThickness]} position={[0, 0.4, -depth/2 + wallThickness/2]}>
           <meshStandardMaterial color="#f1f5f9" />
        </Box>
        <Box args={[wallThickness, 0.8, depth - 1]} position={[width/2 - wallThickness/2, 0.4, 0]}>
           <meshStandardMaterial color="#f1f5f9" />
        </Box>
        <Box args={[wallThickness, 0.8, depth - 1]} position={[-width/2 + wallThickness/2, 0.4, 0]}>
           <meshStandardMaterial color="#f1f5f9" />
        </Box>
      </group>

      {/* Roof Surface (Light Grey - Reflects Light) */}
      <Box args={[width - 1, 0.1, depth - 1]} position={[0, height - 0.1, 0]}>
        <meshStandardMaterial color="#f8fafc" roughness={0.6} />
      </Box>

      {/* Roof Equipment */}
      <group position={[0, height, 0]}>
        <RoofEquipment count={6} areaSize={[width - 4, depth - 4]} />
      </group>

      {/* External Steel Columns (Darker Accent) */}
      {[...Array(6)].map((_, i) => {
         const x = (i - 2.5) * (width / 5);
         return (
           <React.Fragment key={i}>
             <Box args={[0.4, height, 0.4]} position={[x, height/2, depth/2 + 0.1]}>
               <meshStandardMaterial color="#1e293b" />
             </Box>
             <Box args={[0.4, height, 0.4]} position={[x, height/2, -depth/2 - 0.1]}>
               <meshStandardMaterial color="#1e293b" />
             </Box>
           </React.Fragment>
         );
      })}
    </group>
  );
};

// Glass Curtain Wall HQ
const HQBuilding = ({ position }: { position: [number, number, number] }) => {
  return (
    <group position={position}>
      {/* Main Glass Volume */}
      <Box args={[14, 10, 10]} position={[0, 5, 0]} castShadow>
        <meshPhysicalMaterial 
          color="#60a5fa" 
          metalness={0.9} 
          roughness={0.05} 
          transmission={0.3} 
          clearcoat={1}
        />
      </Box>

      {/* Floor Plates (Visible through glass - White) */}
      {[...Array(3)].map((_, i) => (
        <Box key={i} args={[13.8, 0.2, 9.8]} position={[0, 2.5 + i * 2.5, 0]}>
          <meshStandardMaterial color="#f8fafc" />
        </Box>
      ))}

      {/* Concrete Frame / Entrance */}
      <Box args={[6, 4, 11]} position={[0, 2, 0]}>
        <meshStandardMaterial color="#334155" roughness={0.2} />
      </Box>
      
      {/* Entrance Canopy (White) */}
      <Box args={[5, 0.2, 4]} position={[0, 3, 6]}>
        <meshStandardMaterial color="#f8fafc" />
      </Box>
      
      {/* Roof Garden Base */}
      <Box args={[13, 0.5, 9]} position={[0, 10, 0]}>
        <meshStandardMaterial color="#f1f5f9" />
      </Box>
      
      {/* Roof HVAC */}
      <group position={[0, 10.25, 0]}>
         <RoofEquipment count={3} areaSize={[8, 6]} />
      </group>
    </group>
  );
};

// Detailed Truck
const DetailedTruck = ({ position, rotation = [0, 0, 0] }: { position: [number, number, number], rotation?: [number, number, number] }) => (
  <group position={position} rotation={rotation as any}>
    {/* Trailer Body */}
    <Box args={[2.5, 2.8, 8]} position={[0, 1.8, 0]} castShadow>
      <meshStandardMaterial color="#f8fafc" />
    </Box>
    {/* Trailer Details */}
    <Box args={[2.55, 0.1, 8]} position={[0, 2.5, 0]}>
      <meshStandardMaterial color="#cbd5e1" />
    </Box>
    
    {/* Cab */}
    <group position={[0, 0, 5.5]}>
      <Box args={[2.4, 2.2, 2.5]} position={[0, 1.5, 0]} castShadow>
        <meshStandardMaterial color="#dc2626" /> {/* Red Cab */}
      </Box>
      {/* Windshield */}
      <Box args={[2.2, 1, 0.1]} position={[0, 2, 1.26]}>
        <meshStandardMaterial color="#1e293b" roughness={0.2} />
      </Box>
    </group>

    {/* Wheels */}
    <group position={[0, 0.5, 0]}>
      <Box args={[2.8, 1, 1]} position={[0, 0, -2.5]}>
        <meshStandardMaterial color="#1e293b" />
      </Box>
      <Box args={[2.8, 1, 1]} position={[0, 0, -1]}>
        <meshStandardMaterial color="#1e293b" />
      </Box>
      <Box args={[2.8, 1, 1]} position={[0, 0, 5.5]}>
        <meshStandardMaterial color="#1e293b" />
      </Box>
    </group>
  </group>
);

// --- Main Component ---

export const FactoryBuilding3D: React.FC<FactoryBuildingProps> = ({ factory, onClick }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { drillDownToFactory } = useFactoryStore();

  useFrame((state) => {
    if (meshRef.current) {
      const targetY = hovered ? 0.5 : 0;
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    drillDownToFactory(factory);
  };

  return (
    <group 
      position={factory.position} 
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      ref={meshRef}
    >
      {/* Site Base (Asphalt/Concrete Mix) */}
      <Box args={[70, 0.5, 60]} position={[0, -0.25, 0]} receiveShadow>
        <meshStandardMaterial color="#e2e8f0" />
      </Box>
      
      {/* Paved Road Area */}
      <Box args={[70, 0.55, 15]} position={[0, -0.25, 20]} receiveShadow>
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </Box>

      {/* Main HQ */}
      <HQBuilding position={[-15, 0, 5]} />

      {/* Production Halls */}
      <ModernFactoryHall position={[15, 0, -10]} size={[30, 8, 20]} />
      <ModernFactoryHall position={[15, 0, 15]} size={[30, 7, 15]} />

      {/* Connecting Bridge */}
      <Box args={[8, 4, 6]} position={[-2, 4, 5]}>
         <meshPhysicalMaterial color="#94a3b8" metalness={0.5} roughness={0.2} />
      </Box>

      {/* Loading Docks Area */}
      <group position={[32, 0, -10]}>
         {/* Dock Ramp */}
         <Box args={[4, 1.5, 18]} position={[0, 0.75, 0]}>
           <meshStandardMaterial color="#64748b" />
         </Box>
         {/* Trucks */}
         <DetailedTruck position={[3, 0, -5]} rotation={[0, Math.PI/2, 0]} />
         <DetailedTruck position={[3, 0, 5]} rotation={[0, Math.PI/2, 0]} />
      </group>

      {/* Trees & Greenery */}
      <Instances range={30}>
        <cylinderGeometry args={[0.3, 0.5, 1.5]} />
        <meshStandardMaterial color="#5d4037" />
        {[...Array(30)].map((_, i) => {
           const x = (Math.random() - 0.5) * 65;
           const z = (Math.random() - 0.5) * 55;
           // Simple exclusion logic
           if (x > -10 && x < 35 && z > -25 && z < 25) return null;
           return <Instance key={i} position={[x, 0.75, z]} />;
        })}
      </Instances>
      <Instances range={30}>
        <dodecahedronGeometry args={[1.5]} />
        <meshStandardMaterial color="#15803d" />
        {[...Array(30)].map((_, i) => {
           const x = (Math.random() - 0.5) * 65;
           const z = (Math.random() - 0.5) * 55;
           if (x > -10 && x < 35 && z > -25 && z < 25) return null;
           return <Instance key={i} position={[x, 2.5, z]} scale={[1, 1.2, 1]} />;
        })}
      </Instances>

      {/* Factory Label */}
      <Text
        position={[-15, 12, 5]}
        fontSize={2}
        color="#0f172a"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.1}
        outlineColor="#ffffff"
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
      >
        {factory.name}
      </Text>

      {/* Status Indicator */}
      <group position={[0, 18, 0]}>
        <mesh position={[0, 0, 0]}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial 
            color={factory.status === 'running' ? '#4ade80' : '#ef4444'} 
            emissive={factory.status === 'running' ? '#4ade80' : '#ef4444'}
            emissiveIntensity={3}
          />
        </mesh>
        <mesh rotation={[Math.PI/2, 0, 0]}>
          <ringGeometry args={[1.5, 1.8, 32]} />
          <meshBasicMaterial color={factory.status === 'running' ? '#4ade80' : '#ef4444'} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {hovered && (
        <Html position={[0, 12, 10]} center distanceFactor={25} style={{ pointerEvents: 'none' }}>
          <div className="bg-slate-900/95 backdrop-blur px-5 py-3 rounded-xl shadow-2xl border border-slate-700 text-white transform transition-all min-w-[200px]">
            <h3 className="font-bold text-xl mb-1">{factory.name}</h3>
            <div className="h-px bg-slate-700 my-2"></div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs uppercase tracking-wider">Status</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${factory.status === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {factory.status.toUpperCase()}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 text-center">Click to Enter Facility</div>
          </div>
        </Html>
      )}
    </group>
  );
};
