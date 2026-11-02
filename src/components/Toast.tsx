"use client";

import React, { createContext, useContext, useState } from "react";
import { CheckCircle2 } from "lucide-react";

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#1b3b2b]/95 text-[#f5efe6] border border-[#d4af37]/60 shadow-[0_8px_24px_rgba(0,0,0,0.7)] backdrop-blur-md animate-fadeIn text-xs font-montserrat tracking-wide">
          <CheckCircle2 className="w-4 h-4 text-[#ffe5a3] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
};
