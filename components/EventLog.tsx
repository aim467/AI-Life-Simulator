import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface EventLogProps {
  history: LogEntry[];
}

const EventLog: React.FC<EventLogProps> = ({ history }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0 custom-scrollbar pb-2">
      {history.map((entry, idx) => (
        <div 
          key={idx} 
          className={`p-4 rounded-xl border-l-[3px] shadow-sm animate-fade-in relative overflow-hidden
            ${entry.type === 'death' ? 'bg-red-950/40 border-red-500 text-red-200' : 
              entry.type === 'choice' ? 'bg-purple-950/40 border-purple-500 text-purple-200' :
              entry.type === 'achievement' ? 'bg-yellow-900/30 border-yellow-500 text-yellow-200' :
              entry.age === 0 ? 'bg-gray-800/80 border-gray-500 text-gray-300' :
              'bg-gray-800/80 border-blue-500/50 text-gray-100'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono font-bold text-xs opacity-60 bg-black/30 px-2 py-0.5 rounded-md">
              {entry.age} 岁
            </span>
            {entry.type === 'choice' && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 font-bold uppercase">抉择时刻</span>}
            {entry.achievements && entry.achievements.length > 0 && (
                entry.achievements.map((ach, i) => (
                    <span key={i} className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded border border-yellow-500/30 font-bold flex items-center gap-1">
                        🏆 {ach}
                    </span>
                ))
            )}
          </div>
          
          <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium opacity-90">
            {entry.content}
          </div>

          {entry.statsChanged && (
             <div className="mt-3 pt-2 border-t border-white/5 flex flex-wrap gap-3 text-xs opacity-75 font-mono">
               {Object.entries(entry.statsChanged).map(([key, val]) => {
                 const value = val as number;
                 if (value === 0) return null;
                 return (
                   <span key={key} className={`flex items-center gap-1 ${value > 0 ? 'text-green-400' : 'text-red-400'}`}>
                     <span>
                        {key === 'health' ? '❤️' : key === 'intelligence' ? '🧠' : key === 'charm' ? '✨' : key === 'wealth' ? '💰' : '😊'}
                     </span>
                     <span>{value > 0 ? '+' : ''}{value}</span>
                   </span>
                 );
               })}
             </div>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};

export default EventLog;