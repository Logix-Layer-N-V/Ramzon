
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  subtitle: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, trend, isPositive, subtitle }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
          isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {trend}
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <p className="text-xs text-slate-400">{subtitle}</p>
    </div>
  );
};

export default StatsCard;
