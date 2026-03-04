import * as THREE from 'three'
import type { StatusType } from '../factoryData'

export const STATUS_COLORS: Record<StatusType, string> = {
  running: '#4ade80', // green-400
  idle: '#facc15', // yellow-400
  error: '#ef4444', // red-500
}

export const MATERIALS = {
  metal: new THREE.MeshStandardMaterial({
    color: '#8899a6',
    roughness: 0.3,
    metalness: 0.8,
  }),
  floor: new THREE.MeshStandardMaterial({
    color: '#e5e7eb', // gray-200
    roughness: 0.8,
    metalness: 0.1,
  }),
  conveyor: new THREE.MeshStandardMaterial({
    color: '#374151', // gray-700
    roughness: 0.7,
    metalness: 0.2,
  }),
  glass: new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    metalness: 0,
    roughness: 0,
    transmission: 0.9, // Add transparency
    transparent: true,
  }),
  statusEmissive: (status: StatusType) =>
    new THREE.MeshStandardMaterial({
      color: STATUS_COLORS[status],
      emissive: STATUS_COLORS[status],
      emissiveIntensity: 0.5,
      toneMapped: false,
    }),
}
