
import React from 'react';
import { ArrowLeft, GitGraph, Zap, Clock, ShieldAlert, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SolutionOption } from '../types';

const SOLUTIONS: SolutionOption[] = [
  {
    id: 'A',
    title: '方案 A：立即停机更换吸嘴',
    type: 'recommended',
    description: '根因置信度 92%。更换备件库中的 N-204 型吸嘴。',
    duration: '15 min',
    risk: 'low'
  },
  {
    id: 'B',
    title: '方案 B：调整气压参数补偿',
    type: 'alternative',
    description: '临时提高真空发生器负压至 -85kPa，维持生产。',
    duration: '2 min',
    risk: 'medium'
  }
];

const SinanAnalysis: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
            onClick={() => navigate('/')} 
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
        >
            <ArrowLeft size={24} />
        </button>
        <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                司南 · 智能诊断中心
                <span className="text-xs font-normal text-white bg-blue-600 px-2 py-0.5 rounded-full">AI Powered</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">关联工单：#WO-20240523-01 | 异常设备：#5 贴片机</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
        
        {/* Left: Root Cause Analysis (Gewu) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col">
            <div className="flex items-center gap-2 mb-6 text-slate-800">
                <GitGraph className="text-indigo-600" />
                <h2 className="font-bold text-lg">格物 · 根因分析</h2>
            </div>
            
            <div className="flex-1 relative bg-slate-50 rounded-xl border border-slate-100 overflow-hidden flex items-center justify-center">
                 {/* CSS Visualization for Knowledge Graph */}
                 <div className="relative w-full h-full p-10">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <path d="M150,200 L350,150" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" />
                        <path d="M150,200 L350,250" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" />
                        <path d="M350,150 L550,180" stroke="#ef4444" strokeWidth="3" className="animate-pulse" /> {/* High confidence path */}
                    </svg>

                    {/* Nodes */}
                    <div className="absolute top-[180px] left-[50px] w-32 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-sm font-medium text-slate-600 shadow-sm">
                        抛料率高 (8%)
                    </div>

                    <div className="absolute top-[130px] left-[350px] w-36 h-12 bg-white border border-slate-300 rounded-lg flex items-center justify-center text-sm font-medium text-slate-600 shadow-sm">
                        真空度波动
                    </div>
                    
                    <div className="absolute top-[230px] left-[350px] w-36 h-12 bg-white border border-slate-300 rounded-lg flex items-center justify-center text-sm font-medium text-slate-600 shadow-sm opacity-50">
                        物料尺寸偏差
                    </div>

                    {/* Root Cause Node */}
                    <div className="absolute top-[160px] left-[550px] w-40 p-3 bg-red-50 border-2 border-red-500 rounded-xl shadow-lg shadow-red-100 flex flex-col items-center justify-center z-10">
                        <span className="text-xs text-red-500 font-bold uppercase tracking-wider mb-1">Root Cause</span>
                        <span className="font-bold text-red-700">吸嘴磨损</span>
                        <span className="text-xs text-red-400 mt-1">置信度 92%</span>
                    </div>
                 </div>
            </div>

            <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-900 leading-relaxed">
                <span className="font-bold">AI 分析总结：</span> 
                结合设备运行日志（Log-302）与震动传感器数据，系统排除了“物料尺寸”问题。当前真空度曲线呈现周期性泄露特征，92% 概率指向吸嘴老化磨损。
            </div>
        </div>

        {/* Right: Solutions (Tianchou) */}
        <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex-1">
                <div className="flex items-center gap-2 mb-6 text-slate-800">
                    <Zap className="text-amber-500" />
                    <h2 className="font-bold text-lg">天筹 · 决策优化</h2>
                </div>

                <div className="space-y-4">
                    {SOLUTIONS.map(sol => (
                        <div key={sol.id} className={`relative p-6 rounded-xl border-2 transition-all ${
                            sol.type === 'recommended' 
                            ? 'border-blue-500 bg-blue-50/50' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}>
                            {sol.type === 'recommended' && (
                                <div className="absolute -top-3 left-6 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                                    AI 推荐
                                </div>
                            )}
                            
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-slate-800 text-lg">{sol.title}</h3>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="flex items-center gap-1 text-slate-500">
                                        <Clock size={16} /> {sol.duration}
                                    </span>
                                    <span className={`flex items-center gap-1 font-medium ${
                                        sol.risk === 'low' ? 'text-green-600' : 'text-amber-600'
                                    }`}>
                                        <ShieldAlert size={16} /> {sol.risk === 'low' ? '低风险' : '中风险'}
                                    </span>
                                </div>
                            </div>
                            
                            <p className="text-slate-600 mb-6">{sol.description}</p>
                            
                            <div className="flex gap-3">
                                <button className={`flex-1 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                                    sol.type === 'recommended' 
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' 
                                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}>
                                    {sol.type === 'recommended' ? '采纳并执行' : '选择此方案'}
                                </button>
                                {sol.type === 'recommended' && (
                                    <button disabled className="px-4 py-2.5 bg-green-100 text-green-700 rounded-lg font-medium text-sm flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                        <CheckCircle size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Upsell Hook */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-white flex items-center justify-between shadow-lg">
                <div>
                    <h3 className="font-bold mb-1">解锁更多高级算法</h3>
                    <p className="text-sm text-slate-400">当前仅启用了基础诊断，升级以获得“预测性维护”功能。</p>
                </div>
                <button 
                    onClick={() => navigate('/marketplace')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-colors"
                >
                    前往能力商店
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SinanAnalysis;
