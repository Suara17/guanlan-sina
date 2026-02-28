// frontend/components/FactoryVisualization/MaterialParticle.tsx
// 沿路径流动的物料粒子，用 SVG animateMotion 实现
import type React from 'react'

interface MaterialParticleProps {
  /** SVG path d 属性字符串，粒子沿此路径运动 */
  pathD: string
  color: string
  /** 动画时长（秒）*/
  duration: number
  /** 动画延迟（秒），用于错开多个粒子 */
  delay: number
  /** 路径 id，需全局唯一 */
  pathId: string
}

const MaterialParticle: React.FC<MaterialParticleProps> = ({
  pathD,
  color,
  duration,
  delay,
  pathId,
}) => (
  <>
    {/* 隐藏路径（供 animateMotion 引用）*/}
    <path id={pathId} d={pathD} fill="none" stroke="none" />

    {/* 流动粒子 */}
    <circle r={4} fill={color} opacity={0.85}>
      <animateMotion
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
        rotate="auto"
      >
        <mpath href={`#${pathId}`} />
      </animateMotion>
      <animate
        attributeName="opacity"
        values="0;0.85;0.85;0"
        keyTimes="0;0.1;0.9;1"
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </circle>
  </>
)

export default MaterialParticle
