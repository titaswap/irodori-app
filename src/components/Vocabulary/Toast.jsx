
import React, { useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  let bgClass = 'bg-slate-800';
  if (type === 'error') bgClass = 'bg-red-600';
  if (type === 'warning') bgClass = 'bg-amber-600';
  if (type === 'success') bgClass = 'bg-green-600';
  // SAFE RENDER: Ensure message is a string
  const content = typeof message === 'object' ? JSON.stringify(message) : message;
  return ( <div className={`fixed bottom-24 right-6 ${bgClass} text-white px-6 py-3 rounded-lg shadow-xl z-[100] flex items-center font-medium animate-in fade-in slide-in-from-bottom-5`}>{content}</div> );
};

export default Toast;
