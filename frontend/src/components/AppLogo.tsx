import React from 'react';
import { Package, Boxes } from 'lucide-react';

interface AppLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({ 
  className = '', 
  size = 'md',
  showSubtitle = true 
}) => {
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative flex items-center justify-center bg-rose-900 text-white rounded-lg p-2 shadow-sm border border-rose-800">
        <Boxes className={`${iconSizes[size]} text-amber-300`} />
        <span className="absolute -bottom-1 -right-1 bg-amber-400 text-rose-950 text-[9px] font-black px-1 rounded-sm">
          IN
        </span>
      </div>
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-extrabold tracking-wider text-rose-900 text-xs px-1 py-0.5 bg-rose-100 rounded border border-rose-300">
            VHAT
          </span>
          <span className={`font-black tracking-tight text-neutral-900 ${textSizes[size]}`}>
            Stock<span className="text-rose-800">Sense</span>
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] tracking-widest text-neutral-500 font-medium uppercase mt-0.5">
            Inventory Management System
          </span>
        )}
      </div>
    </div>
  );
};
