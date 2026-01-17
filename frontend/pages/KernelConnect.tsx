import React, { useState } from 'react';
import { Wifi, CheckCircle, Server, Loader2, AlertCircle } from 'lucide-react';

const KernelConnect: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [step, setStep] = useState(1);

  const startScan = () => {
    setScanning(true);
    // Simulate scanning delay
    setTimeout(() => {
        setDevices([
            { id: 1, name: 'Siemens PLC S7-1200', ip: '192.168.0.101', status: 'ready', type: 'PLC' },
            { id: 2, name: 'Hikvision Camera A4', ip: '192.168.0.105', status: 'ready', type: 'Camera' },
            { id: 3, name: 'Temp Sensor Array', ip: '192.168.0.112', status: 'ready', type: 'IoT' },
        ]);
        setScanning(false);
        setStep(2);
    }, 2000);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">OS 内核接入向导</h1>
        <p className="text-slate-500 mt-2">快速扫描并连接局域网内的工业设备，建立基础数据通道。</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Progress Steps */}
        <div className="flex border-b border-slate-100 bg-slate-50">
            {[1, 2, 3].map((s) => (
                <div key={s} className={`flex-1 py-4 text-center text-sm font-medium ${step >= s ? 'text-blue-600' : 'text-slate-400'}`}>
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 ${step >= s ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-white'}`}>
                        {s}
                    </span>
                    {s === 1 ? '设备扫描' : s === 2 ? '协议匹配' : '诊断报告'}
                </div>
            ))}
        </div>

        <div className="p-8 min-h-[400px] flex flex-col items-center justify-center">
            {step === 1 && (
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                        {scanning ? <Loader2 className="animate-spin" size={32} /> : <Wifi size={32} />}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{scanning ? '正在扫描局域网...' : '准备开始接入'}</h3>
                    <p className="text-slate-500 mb-8">系统将自动发现支持 Modbus/OPC UA 协议的设备。</p>
                    <button 
                        onClick={startScan}
                        disabled={scanning}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-all"
                    >
                        {scanning ? '扫描中...' : '开始扫描'}
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">发现 {devices.length} 台设备</h3>
                    <div className="space-y-3 mb-8">
                        {devices.map(dev => (
                            <div key={dev.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <Server className="text-slate-400" size={20} />
                                    <div>
                                        <p className="font-medium text-slate-900">{dev.name}</p>
                                        <p className="text-xs text-slate-500">{dev.ip} • {dev.type}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-1 rounded-full">
                                    <CheckCircle size={14} />
                                    <span>协议已匹配</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-3">
                         <button onClick={() => setStep(1)} className="px-5 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">重试</button>
                         <button onClick={() => setStep(3)} className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg">生成基础诊断报告</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="w-full max-w-3xl text-left animate-in zoom-in-95 duration-300">
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg flex items-center gap-3 mb-6">
                        <CheckCircle className="text-emerald-600" size={20} />
                        <span className="text-emerald-800 font-medium">设备连接成功，数据通道已打通。</span>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                        <h4 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">产线效率初诊报告 (Lite)</h4>
                        <div className="grid grid-cols-2 gap-8 mb-6">
                            <div>
                                <p className="text-sm text-slate-500">连接时长</p>
                                <p className="text-2xl font-mono text-slate-900">00:05:23</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500">数据吞吐量</p>
                                <p className="text-2xl font-mono text-slate-900">128 packets/s</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                             <h5 className="font-medium text-slate-700 flex items-center gap-2">
                                <AlertCircle size={16} className="text-amber-500"/> 发现潜在问题
                             </h5>
                             <div className="p-3 bg-amber-50 border border-amber-100 rounded text-sm text-amber-800">
                                1. <strong>S7-1200 PLC</strong> 检测到周期性通信延迟，可能影响控制精度。
                             </div>
                             <div className="p-3 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
                                <strong>建议：</strong> 前往“能力商店”订阅“工业网络优化”模块以解决此问题。
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default KernelConnect;
