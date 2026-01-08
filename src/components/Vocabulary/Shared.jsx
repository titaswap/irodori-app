
import React from 'react';

export const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${className}`}>
    {children}
  </div>
);

export const Button = ({ onClick, children, variant = "primary", size = "md", className = "", disabled = false }) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600",
    danger: "bg-red-100 text-red-900 hover:bg-red-200 focus:ring-red-500 dark:bg-red-900/30 dark:text-red-100 dark:hover:bg-red-900/50",
    ghost: "text-slate-600 hover:bg-slate-100 focus:ring-slate-500 dark:text-slate-400 dark:hover:bg-slate-800",
    icon: "p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
  };
  const sizes = { sm: "px-3 py-1.5 text-sm rounded-md", md: "px-4 py-2 text-sm rounded-lg", lg: "px-6 py-3 text-base rounded-xl", icon: "p-2" };
  return <button onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}>{children}</button>;
};

export const HeatmapBar = ({ value, max = 5 }) => {
  const score = Math.min(value || 0, max);
  const bars = [];
  for (let i = 0; i < max; i++) {
    let colorClass = "bg-slate-200";
    if (i < score) { if (score <= 2) colorClass = "bg-yellow-400"; else if (score <= 3) colorClass = "bg-orange-500"; else colorClass = "bg-red-600"; }
    bars.push(<div key={i} className={`h-3 w-1.5 rounded-sm ${colorClass}`}></div>);
  }
  return <div className="flex gap-0.5">{bars}</div>;
};
