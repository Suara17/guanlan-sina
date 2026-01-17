
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Sector
} from 'recharts';
import { AlertItem, ProductionData } from '../types';
import SinanAvatar from '../components/SinanAvatar';
import { Clock, Factory, AlertTriangle, CheckCircle2 } from 'lucide-react';

// Mock Data
const PRODUCTION_DATA: ProductionData[] = [
  { time: '08:00', planned: 200, actual: 198 },
  { time: '09:00', planned: 220, actual: 215 },
  { time: '10:00', planned: 220, actual: 180 }, // Defect triggers red
  { time: '11:00', planned: 200, actual: 205 },
  { time: '12:00', planned: 150, actual: 150 }, // Lunch break
  { time: '13:00', planned: 220, actual: 218 },
  { time: '14:00', planned: 220, actual: 175 }, // Another drop
];

const ALERTS: AlertItem[] = [
  { id: '1', time: '14:32', level: 'warning', location: '#3 工位', message: '生产节拍偏慢 (-15%)' },
  { id: '2', time: '14:15', level: 'critical', location: '#5 贴片机', message: '连续3次检测到吸嘴漏气' },
  { id: '3', time: '13:45', level: 'error', location: '#2 机械臂', message: '伺服电机温度过高 (75°C)' },
  { id: '4', time: '11:20', level: 'warning', location: '#1 上料机', message: '料盘余量不足 10%' },
];

const QUALITY_DATA = [
  { name: '良品', value: 92 },
  { name: '不良品', value: 8 },
];

const Dashboard: React.FC = () => {
  const [sinanMode, setSinanMode] = useState<'idle' | 'alert'>('idle');
  
  // Simulate anomaly detection after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setSinanMode('alert');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill="#334155" className="text-3xl font-bold">
          {payload.name === '不良品' ? '8%' : ''}
        </text>
        <text x={cx} y={cy + 25} dy={8} textAnchor="middle" fill="#94a3b8" className="text-xs">
          不良率
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className="p-4 md:p-6 min-h-full flex flex-col gap-6">
      
      {/* Header Info Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-green-50 text-green-700 rounded-lg border border-green-100">
                <Factory size={20} />
            </div>
            <div>
                <h1 className="text-lg font-bold text-slate-800">SMT 智能产线 A03</h1>
                <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 运行中
                    <span className="w-px h-3 bg-slate-300"></span>
                    工单: #WO-20240523-01
                </p>
            </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm">
             <div className="text-right">
                <p className="text-slate-400 text-xs">当前班次</p>
                <p className="font-semibold text-slate-700">白班 (08:00 - 20:00)</p>
             </div>
             <div className="text-right border-l border-slate-100 pl-6">
                <p className="text-slate-400 text-xs">负责人</p>
                <p className="font-semibold text-slate-700">张工</p>
             </div>
             <div className="text-right border-l border-slate-100 pl-6">
                <p className="text-slate-400 text-xs">运行时间</p>
                <p className="font-mono font-semibold text-blue-600">06:32:15</p>
             </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Left Column: KPIs & Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Production Monitor */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex-1">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Clock size={18} className="text-blue-500"/> 实时产量监控
                    </h3>
                    <div className="flex gap-4 text-xs">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-slate-200 rounded-sm"></span> 计划产量</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> 实际产量</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm"></span> 异常差值</span>
                    </div>
                </div>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={PRODUCTION_DATA} barGap={0}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                            <Tooltip 
                                cursor={{fill: '#f1f5f9'}}
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            />
                            <Bar dataKey="planned" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="actual" radius={[4, 4, 0, 0]} barSize={20}>
                                {PRODUCTION_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.actual < entry.planned * 0.95 ? '#f87171' : '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Quality Monitor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <h3 className="font-bold text-slate-800 mb-2">质量实时看板</h3>
                    <div className="h-full -mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={QUALITY_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    activeIndex={1}
                                    activeShape={renderActiveShape}
                                >
                                    <Cell key="cell-0" fill="#22c55e" /> {/* Green for Good */}
                                    <Cell key="cell-1" fill="#ef4444" /> {/* Red for Bad */}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                        <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">
                            环比昨日 ↑0.8%
                        </span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center gap-4">
                     <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">设备综合效率 (OEE)</span>
                        <span className="text-xl font-bold text-slate-800">82.5%</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '82.5%'}}></div>
                     </div>
                     
                     <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-slate-500">本班次完成率</span>
                        <span className="text-xl font-bold text-slate-800">94.2%</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{width: '94.2%'}}></div>
                     </div>

                     <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-slate-500">平均节拍 (CT)</span>
                        <span className="text-xl font-bold text-slate-800">24s</span>
                     </div>
                     <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-amber-500 h-2 rounded-full" style={{width: '60%'}}></div>
                     </div>
                </div>
            </div>
        </div>

        {/* Right Column: Alert Stream & Sinan */}
        <div className="flex flex-col gap-6">
            
            {/* Alert Stream */}
            <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex-1 overflow-hidden flex flex-col">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
                    <span>异常信息流</span>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">3 待处理</span>
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200"></div>

                    {ALERTS.map((alert) => (
                        <div key={alert.id} className="relative pl-6 group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                            <div className={`absolute left-[5px] top-4 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-10 
                                ${alert.level === 'critical' ? 'bg-red-500' : alert.level === 'error' ? 'bg-orange-500' : 'bg-yellow-400'}`}>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-mono text-slate-400">{alert.time}</span>
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border 
                                    ${alert.level === 'critical' ? 'bg-red-50 border-red-100 text-red-600' : 
                                      alert.level === 'error' ? 'bg-orange-50 border-orange-100 text-orange-600' : 
                                      'bg-yellow-50 border-yellow-100 text-yellow-700'}`}>
                                    {alert.level}
                                </span>
                            </div>
                            <p className="font-medium text-slate-800 text-sm mt-1">{alert.location}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{alert.message}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sinan Assistant Area */}
            <div className="h-64 relative">
                <SinanAvatar 
                    mode={sinanMode} 
                    alertMessage="#5 贴片机 不良品率飙升至 8%！疑似吸嘴故障。"
                    className="h-full justify-end pb-4"
                />
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
