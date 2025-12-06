import React from 'react';
import { Stats } from '../types';

interface StatsPanelProps {
  stats: Stats;
}

const StatBar: React.FC<{ label: string; value: number; color: string; icon: string }> = ({ label, value, color, icon }) => {
  // Clamp value between 0 and 100 for width
  const width = Math.min(Math.max(value, 0), 100);
  
  return (
    <div className="flex flex-col mb-3">
      <div className="flex justify-between text-xs mb-1 font-medium text-gray-300">
        <span className="flex items-center gap-1">{icon} {label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2.5 w-full bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ease-out ${color}`} 
          style={{ width: `${width}%` }}
        ></div>
      </div>
    </div>
  );
};

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
      <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">
        Core Attributes
      </h3>
      <StatBar label="健康 (Health)" value={stats.health} color="bg-red-500" icon="❤️" />
      <StatBar label="智力 (Smarts)" value={stats.intelligence} color="bg-blue-500" icon="🧠" />
      <StatBar label="魅力 (Charm)" value={stats.charm} color="bg-pink-500" icon="✨" />
      <StatBar label="家境 (Wealth)" value={stats.wealth} color="bg-yellow-500" icon="💰" />
      <StatBar label="快乐 (Happy)" value={stats.happiness} color="bg-green-500" icon="😊" />
    </div>
  );
};

export default StatsPanel;