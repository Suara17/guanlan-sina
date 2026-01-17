import React from 'react';
import { Capability } from '../types';
import { Eye, Cpu, Network, LineChart, ShoppingBag, Check } from 'lucide-react';

const CAPABILITIES: Capability[] = [
  { id: '1', title: 'MSA-YOLO 视觉检测', description: '基于深度学习的表面缺陷检测算法，毫秒级响应。', category: 'Vision', price: '¥599/月', subscribed: false, iconName: 'Eye' },
  { id: '2', title: '天筹·运筹优化引擎', description: '针对排程调度的求解器，提升产线吞吐量 15% 以上。', category: 'Optimization', price: '¥1,200/月', subscribed: true, iconName: 'Cpu' },
  { id: '3', title: '格物·知识图谱', description: '设备故障根因分析与推理，建立设备维护知识库。', category: 'Data', price: '¥800/月', subscribed: false, iconName: 'Network' },
  { id: '4', title: '浑天·仿真推演', description: '数字孪生仿真环境，零成本验证生产策略变更。', category: 'Simulation', price: '¥2,000/月', subscribed: false, iconName: 'LineChart' },
];

const Marketplace: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">原子能力商店</h1>
            <p className="text-slate-500 mt-2">像搭积木一样订阅工业算法，即插即用，按需付费。</p>
        </div>
        <div className="flex gap-2 text-sm text-slate-600 bg-white px-3 py-1 rounded border border-slate-200">
            <span>当前已订阅：</span>
            <span className="font-bold text-blue-600">1 项能力</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {CAPABILITIES.map((cap) => {
            const Icon = cap.category === 'Vision' ? Eye : cap.category === 'Optimization' ? Cpu : cap.category === 'Data' ? Network : LineChart;
            return (
                <div key={cap.id} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden group">
                    <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600"></div>
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Icon size={24} />
                            </div>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{cap.category}</span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-800 mb-2">{cap.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">{cap.description}</p>
                        
                        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                            <span className="font-bold text-slate-900">{cap.price}</span>
                            {cap.subscribed ? (
                                <button disabled className="px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg flex items-center gap-2 cursor-default">
                                    <Check size={16} /> 已订阅
                                </button>
                            ) : (
                                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-2">
                                    <ShoppingBag size={16} /> 订阅
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )
        })}
        
        {/* Placeholder for "Coming Soon" */}
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 hover:border-blue-300 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl text-slate-400">+</span>
            </div>
            <h3 className="font-medium text-slate-600">更多能力即将上线</h3>
            <p className="text-xs text-slate-400 mt-1">第三方开发者正在接入...</p>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
