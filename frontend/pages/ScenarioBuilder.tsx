import React, { useState } from 'react';
import { Cuboid, ArrowRight, Play, Save, RotateCcw } from 'lucide-react';

const ScenarioBuilder: React.FC = () => {
  const [nodes, setNodes] = useState([
    { id: '1', label: '相机采集 (Cam-01)', type: 'source', x: 50, y: 100 },
    { id: '2', label: 'MSA-YOLO 检测', type: 'process', x: 300, y: 100 },
    { id: '3', label: 'NG 剔除指令', type: 'action', x: 550, y: 50 },
    { id: '4', label: '数据上云', type: 'action', x: 550, y: 150 },
  ]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Toolbar */}
        <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h2 className="font-bold text-slate-800">PCB 缺陷检测流程 <span className="text-xs font-normal text-slate-400 px-2 py-0.5 border rounded ml-2">草稿</span></h2>
            </div>
            <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded text-sm font-medium flex items-center gap-2">
                    <RotateCcw size={16} /> 重置
                </button>
                <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded text-sm font-medium flex items-center gap-2">
                    <Save size={16} /> 保存
                </button>
                <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                    <Play size={16} /> 部署运行
                </button>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Palette */}
            <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">组件库</h3>
                
                <div className="space-y-6">
                    <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">数据源</h4>
                        <div className="space-y-2">
                            <div className="p-3 bg-white border border-slate-200 rounded cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-sm transition-all text-sm text-slate-700">
                                📷 工业相机流
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-sm transition-all text-sm text-slate-700">
                                🔌 PLC 信号
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">原子能力 (已订阅)</h4>
                        <div className="space-y-2">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded cursor-grab active:cursor-grabbing hover:shadow-sm transition-all text-sm text-blue-800 font-medium">
                                🧠 MSA-YOLO 检测
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-sm transition-all text-sm text-slate-700">
                                🧮 运筹优化求解
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">执行动作</h4>
                        <div className="space-y-2">
                            <div className="p-3 bg-white border border-slate-200 rounded cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-sm transition-all text-sm text-slate-700">
                                🤖 机械臂控制
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-sm transition-all text-sm text-slate-700">
                                ☁️ 发送至 MQTT
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Canvas Area (Visual Simulation) */}
            <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-10" 
                     style={{backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
                </div>

                {/* Simulated Nodes & Connections using absolute positioning */}
                <div className="relative w-[800px] h-[500px] bg-white/50 backdrop-blur-sm rounded-xl border border-dashed border-slate-300 shadow-sm">
                     <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {/* Connecting Lines */}
                        <path d="M180,135 C240,135 240,135 300,135" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                        <path d="M460,135 C505,135 505,85 550,85" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                        <path d="M460,135 C505,135 505,185 550,185" stroke="#94a3b8" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
                        
                        <defs>
                            <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8" />
                            </marker>
                        </defs>
                     </svg>

                     {nodes.map(node => (
                        <div 
                            key={node.id}
                            style={{ left: node.x, top: node.y }}
                            className={`absolute z-10 w-40 p-3 rounded-lg border shadow-sm cursor-move flex items-center gap-2 ${
                                node.type === 'source' ? 'bg-white border-slate-300' :
                                node.type === 'process' ? 'bg-blue-50 border-blue-300 text-blue-900' :
                                'bg-emerald-50 border-emerald-300 text-emerald-900'
                            }`}
                        >
                            <Cuboid size={16} className="opacity-50"/>
                            <span className="text-sm font-medium">{node.label}</span>
                        </div>
                     ))}

                     <div className="absolute bottom-4 right-4 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded">
                        画布缩放: 100%
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ScenarioBuilder;
