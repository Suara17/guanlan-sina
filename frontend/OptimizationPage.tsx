import React from 'react';
import { Card } from '../components/Card';
import { 
  Building2, 
  Settings2, 
  Truck, 
  Anchor, 
  ChevronRight,
  ArrowRight,
  Info
} from 'lucide-react';
import { OptimizationScheme } from '../types';

const RatingDots = ({ count, color = 'bg-blue-500' }: { count: number; color?: string }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <div 
        key={i} 
        className={`w-2 h-2 rounded-full ${i <= count ? color : 'bg-slate-200'}`}
      />
    ))}
  </div>
);

const schemes: OptimizationScheme[] = [
  { id: '1', name: '极端-低成本', type: 'recommendation', totalInput: 1, schedule: 2, revenue: 3, score: 78, tags: ['ID:1'] },
  { id: '4', name: '极端-短工期', type: 'recommendation', totalInput: 2, schedule: 1, revenue: 3, score: 82, tags: ['ID:4'] },
  { id: '6', name: '极端-高收益', type: 'recommendation', totalInput: 4, schedule: 4, revenue: 5, score: 85, tags: ['ID:6'] },
  { id: '2', name: '综合-性价比', type: 'recommendation', totalInput: 2, schedule: 2, revenue: 4, score: 92, tags: ['ID:2'], isHighlight: true },
  { id: '7', name: '折中-中心点', type: 'custom', totalInput: 3, schedule: 3, revenue: 3, score: 80, tags: ['ID:7'] },
];

export default function OptimizationPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Filter Bar */}
      <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500 px-2">筛选:</span>
          <select className="bg-blue-50 text-blue-700 border border-blue-100 rounded-md px-4 py-1.5 text-sm font-medium outline-none">
            <option>企业名称: 天工集团</option>
          </select>
          <select className="bg-blue-50 text-blue-700 border border-blue-100 rounded-md px-4 py-1.5 text-sm font-medium outline-none">
            <option>工厂类型: 离散制造</option>
          </select>
          <select className="bg-blue-50 text-blue-700 border border-blue-100 rounded-md px-4 py-1.5 text-sm font-medium outline-none">
            <option>工厂产线: 自动装配A线</option>
          </select>
        </div>
        <div className="flex-1"></div>
        <input 
          type="text" 
          placeholder="请输入行业代码" 
          className="border border-slate-200 rounded-md px-4 py-1.5 text-sm w-64 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Top Section: Evaluation Images & Stats */}
      <div className="grid grid-cols-12 gap-6">
        {/* Images */}
        <Card className="col-span-12 lg:col-span-9" title="评估结果">
           <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative group overflow-hidden rounded-lg border border-slate-100 bg-slate-50 aspect-video flex items-center justify-center">
                  <svg className="w-16 h-16 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span className="text-xs bg-black/60 text-white px-2 py-1 rounded">视图 {i}</span>
                  </div>
                </div>
              ))}
           </div>
        </Card>

        {/* Blue Stats Card */}
        <div className="col-span-12 lg:col-span-3 bg-blue-600 rounded-xl p-6 text-white shadow-lg shadow-blue-200 flex flex-col justify-between">
           <div className="space-y-6">
              <div className="flex items-start gap-4">
                 <Building2 className="mt-1 opacity-80" size={24} />
                 <div>
                    <div className="text-blue-100 text-sm font-medium">车间尺寸</div>
                    <div className="text-2xl font-bold">1200 <span className="text-sm font-normal opacity-70">m²</span></div>
                 </div>
              </div>
              <div className="flex items-start gap-4">
                 <Info className="mt-1 opacity-80" size={24} />
                 <div>
                    <div className="text-blue-100 text-sm font-medium">设备总数</div>
                    <div className="text-2xl font-bold">48 <span className="text-sm font-normal opacity-70">台</span></div>
                 </div>
              </div>
              <div className="flex items-start gap-4">
                 <Settings2 className="mt-1 opacity-80" size={24} />
                 <div>
                    <div className="text-blue-100 text-sm font-medium">可移动设备</div>
                    <div className="text-2xl font-bold">32 <span className="text-sm font-normal opacity-70">台</span></div>
                 </div>
              </div>
              <div className="flex items-start gap-4">
                 <Anchor className="mt-1 opacity-80" size={24} />
                 <div>
                    <div className="text-blue-100 text-sm font-medium">固定设备</div>
                    <div className="text-2xl font-bold">16 <span className="text-sm font-normal opacity-70">台</span></div>
                 </div>
              </div>
           </div>
           <div className="mt-4 pt-4 border-t border-blue-500/50 text-center">
              <button className="text-sm font-medium hover:text-blue-100 flex items-center justify-center gap-1 w-full">
                查看详细参数 <ChevronRight size={14} />
              </button>
           </div>
        </div>
      </div>

      {/* Middle Section: Optimization Table & Sliders */}
      <div className="grid grid-cols-12 gap-6">
        {/* Table */}
        <Card className="col-span-12 lg:col-span-9" title="优化方案详情">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">方案序号</th>
                  <th className="px-4 py-3">物料搬运成本</th>
                  <th className="px-4 py-3">设备移动成本</th>
                  <th className="px-4 py-3">空间利用率</th>
                  <th className="px-4 py-3">总适应度</th>
                  <th className="px-4 py-3 text-right">方案详情</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { id: 1, c1: '¥ 165,345.59', c2: '¥ 153,565.94', c3: '12.45%', score: 0.85 },
                  { id: 2, c1: '¥ 153,565.94', c2: '¥ 113,042.51', c3: '9.26%', score: 0.92 },
                  { id: 3, c1: '¥ 153,565.94', c2: '¥ 105,024.16', c3: '8.21%', score: 0.78 },
                  { id: 4, c1: '¥ 132,567.46', c2: '¥ 153,565.94', c3: '10.55%', score: 0.82 },
                ].map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{row.id}</td>
                    <td className="px-4 py-3 text-slate-600">{row.c1}</td>
                    <td className="px-4 py-3 text-slate-600">{row.c2}</td>
                    <td className="px-4 py-3 text-slate-600">{row.c3}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${row.score * 100}%` }}></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-blue-600 hover:text-blue-800 cursor-pointer text-xs font-medium underline decoration-blue-200 underline-offset-2">查看可视化</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Sliders */}
        <Card className="col-span-12 lg:col-span-3" title="决策偏好设置">
           <div className="space-y-6 pt-2">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium text-slate-700">
                   <span>成本权重</span>
                   <span className="text-blue-600">60%</span>
                </div>
                <input type="range" className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium text-slate-700">
                   <span>工期权重</span>
                   <span className="text-amber-500">30%</span>
                </div>
                <input type="range" className="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium text-slate-700">
                   <span>收益权重</span>
                   <span className="text-green-500">10%</span>
                </div>
                <input type="range" className="w-full accent-green-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              
              <div className="pt-4 flex gap-2">
                 <button className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg text-sm font-medium hover:bg-slate-200">重置</button>
                 <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">应用权重</button>
              </div>
           </div>
        </Card>
      </div>

      {/* Bottom Section: Representative Schemes */}
      <div>
        <div className="flex items-center gap-4 mb-4">
           <h3 className="font-bold text-slate-800 text-lg">代表方案</h3>
           <div className="flex items-center gap-4 text-xs font-medium ml-4">
              <div className="flex items-center gap-1.5">
                 <div className="w-3 h-3 rounded-full bg-blue-500"></div> 系统推荐
              </div>
              <div className="flex items-center gap-1.5">
                 <div className="w-3 h-3 rounded-full bg-pink-500"></div> 个性推荐
              </div>
           </div>
           
           <div className="flex-1 flex justify-end gap-2">
              <button className="p-1 rounded-full bg-white hover:bg-slate-100 border border-slate-200 shadow-sm"><ChevronRight className="rotate-180" size={20} /></button>
              <button className="p-1 rounded-full bg-white hover:bg-slate-100 border border-slate-200 shadow-sm"><ChevronRight size={20} /></button>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {schemes.map((scheme) => (
            <div 
              key={scheme.id} 
              className={`
                relative flex flex-col p-5 rounded-xl transition-all duration-300
                ${scheme.isHighlight 
                  ? 'bg-white border-2 border-blue-500 shadow-xl shadow-blue-100 scale-105 z-10' 
                  : scheme.type === 'custom' 
                    ? 'bg-white border-2 border-pink-400 shadow-md'
                    : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
                }
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-slate-800">{scheme.name}</h4>
                <span className="text-xs font-mono text-slate-400">{scheme.tags?.[0]}</span>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${scheme.isHighlight ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                      <span className="text-sm text-slate-600">总投入</span>
                   </div>
                   <RatingDots count={scheme.totalInput} color="bg-blue-500" />
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${scheme.isHighlight ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                      <span className="text-sm text-slate-600">工期</span>
                   </div>
                   <RatingDots count={scheme.schedule} color="bg-indigo-500" />
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${scheme.isHighlight ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                      <span className="text-sm text-slate-600">年收益</span>
                   </div>
                   <RatingDots count={scheme.revenue} color="bg-amber-500" />
                </div>
              </div>

              <div className="mt-2">
                <div className="flex justify-between text-sm mb-2 font-medium text-slate-500">
                  <span>综合得分</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: `${scheme.score}%` }}></div>
                </div>
                <button className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                  scheme.isHighlight 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                  选择方案
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}