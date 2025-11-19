'use client';

import { cn } from '@/lib/utils';

interface DeepSeekIconProps {
  className?: string;
  animate?: boolean;
}

export function DeepSeekIcon({ className, animate = true }: DeepSeekIconProps) {
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("w-full h-full", animate && "animate-pulse")}
      >
        {/* 外圈 */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="opacity-30"
        />
        
        {/* 中间圈 */}
        <circle
          cx="12"
          cy="12"
          r="7"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          className="opacity-50"
        />
        
        {/* 内圈（渐变填充）*/}
        <circle
          cx="12"
          cy="12"
          r="4"
          fill="currentColor"
          className="opacity-70"
        />
        
        {/* 中心点 */}
        <circle
          cx="12"
          cy="12"
          r="1.5"
          fill="white"
        />
        
        {/* 闪烁效果的光点 */}
        <circle
          cx="12"
          cy="6"
          r="1"
          fill="currentColor"
          className={cn(animate && "animate-ping")}
        />
        <circle
          cx="18"
          cy="12"
          r="1"
          fill="currentColor"
          className={cn(animate && "animate-ping")}
          style={{ animationDelay: '0.15s' }}
        />
        <circle
          cx="12"
          cy="18"
          r="1"
          fill="currentColor"
          className={cn(animate && "animate-ping")}
          style={{ animationDelay: '0.3s' }}
        />
        <circle
          cx="6"
          cy="12"
          r="1"
          fill="currentColor"
          className={cn(animate && "animate-ping")}
          style={{ animationDelay: '0.45s' }}
        />
      </svg>
    </div>
  );
}

