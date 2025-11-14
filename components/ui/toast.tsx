'use client';

import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 入场动画
    setIsVisible(true);
    
    // 自动关闭
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // 等待退场动画完成
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  const Icon = type === 'success' ? Check : X;

  return (
    <div
      className={`fixed top-20 right-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg text-white ${bgColor} transition-all duration-300 max-w-md ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="text-sm font-medium whitespace-normal">{message}</span>
    </div>
  );
}

// Toast 容器组件
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

