
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronRight, MessageCircle } from 'lucide-react';

interface SinanAvatarProps {
  mode: 'idle' | 'alert';
  alertMessage?: string;
  className?: string;
}

const SinanAvatar: React.FC<SinanAvatarProps> = ({ mode, alertMessage, className }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  // CSS for simple robot animation
  const robotStyle = `
    @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
    @keyframes blink { 0%, 90%, 100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
    .animate-float { animation: float 3s ease-in-out infinite; }
    .animate-blink { animation: blink 4s infinite; }
  `;

  return (
    <div className={`relative flex flex-col items-center justify-end ${className}`}>
      <style>{robotStyle}</style>

      {/* Chat Bubble */}
      <div 
        className={`absolute bottom-28 w-64 bg-white p-4 rounded-2xl rounded-br-none shadow-xl border border-blue-100 transition-all duration-300 transform origin-bottom-right cursor-pointer
        ${mode === 'alert' ? 'opacity-100 scale-100' : isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
        onClick={() => mode === 'alert' && navigate('/sinan-analysis')}
      >
        <div className="flex items-start gap-3">
            {mode === 'alert' ? (
                <div className="p-1.5 bg-red-100 text-red-600 rounded-full shrink-0 animate-pulse">
                    <AlertCircle size={16} />
                </div>
            ) : (
                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-full shrink-0">
                    <MessageCircle size={16} />
                </div>
            )}
            <div>
                <h4 className={`font-bold text-sm mb-1 ${mode === 'alert' ? 'text-red-600' : 'text-slate-700'}`}>
                    {mode === 'alert' ? '检测到异常！' : '司南在线'}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                    {mode === 'alert' ? alertMessage : '产线运行平稳，今日产量已达标 85% ~'}
                </p>
                {mode === 'alert' && (
                    <button className="mt-2 text-xs font-semibold text-blue-600 flex items-center hover:underline">
                        查看分析与对策 <ChevronRight size={12} />
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* Robot Avatar */}
      <div 
        className="relative w-32 h-32 animate-float cursor-pointer group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => mode === 'alert' && navigate('/sinan-analysis')}
      >
        {/* Head */}
        <div className="absolute inset-0 bg-white rounded-3xl border-2 border-slate-200 shadow-lg flex flex-col items-center justify-center overflow-hidden">
            {/* Screen/Face */}
            <div className={`w-24 h-16 rounded-xl flex items-center justify-center gap-4 transition-colors duration-500
                ${mode === 'alert' ? 'bg-red-50' : 'bg-slate-900'}`}
            >
                {/* Eyes */}
                <div className={`w-3 h-8 rounded-full animate-blink ${mode === 'alert' ? 'bg-red-500 rotate-12' : 'bg-blue-400'}`}></div>
                <div className={`w-3 h-8 rounded-full animate-blink ${mode === 'alert' ? 'bg-red-500 -rotate-12' : 'bg-blue-400'}`}></div>
            </div>
            
            {/* Mouth (Simple line) */}
            <div className={`mt-2 w-4 h-1 rounded-full ${mode === 'alert' ? 'bg-red-400 w-8' : 'bg-slate-300'}`}></div>
        </div>

        {/* Antenna */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1 h-4 bg-slate-300"></div>
        <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${mode === 'alert' ? 'bg-red-500 animate-ping' : 'bg-blue-400'}`}></div>
        
        {/* Shadow */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/10 rounded-full blur-sm"></div>
      </div>
    </div>
  );
};

export default SinanAvatar;
