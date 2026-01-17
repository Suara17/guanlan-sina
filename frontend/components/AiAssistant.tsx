
import React, { useState, useEffect } from 'react';
import { Sparkles, X, MessageSquare } from 'lucide-react';
import { analyzeSystemHealth } from '../services/geminiService';

interface AiAssistantProps {
  contextData: any;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ contextData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: '您好！我是天工·弈控的智能助手。我可以帮您分析产线数据或推荐优化算法。' }
  ]);

  const handleAnalyze = async () => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: '请分析当前产线健康状况并给出建议。' }]);
    
    const analysis = await analyzeSystemHealth(contextData);
    
    setMessages(prev => [...prev, { role: 'ai', content: analysis }]);
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <div className="w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <span className="font-semibold">AI 智囊团</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded p-1">
                <X size={16} />
            </button>
          </div>
          
          <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                    }`}>
                        {msg.content}
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm border border-slate-100 flex gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100">
             <button 
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium rounded-lg text-sm transition-colors flex justify-center items-center gap-2"
             >
                <Sparkles size={16} />
                一键诊断产线健康
             </button>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-lg shadow-blue-600/30 text-white flex items-center justify-center hover:scale-105 transition-all"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default AiAssistant;