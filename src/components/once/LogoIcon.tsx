import React from "react";

export const LogoIcon: React.FC<{ className?: string }> = ({ className = "w-9 h-9" }) => {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-xl shadow-md ${className}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-full h-full">
        <rect width="64" height="64" rx="16" fill="#1C1A17" />
        
        <path d="M25 15c-1.5-2.5 1.2-4.5 0-7" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M35 15c-1.5-2.5 1.2-4.5 0-7" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" fill="none"/>

        <path d="M43 25c7 0 11 5 11 11s-4 11-11 11" fill="none" stroke="#F59E0B" strokeWidth="4.5" strokeLinecap="round"/>

        <path d="M14 20h30c0 0 0 18-4 26-2 4-5 6-11 6s-9-2-11-6c-4-8-4-26-4-26z" fill="#F59E0B"/>

        <path d="M10 55h38" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" fill="none"/>

        <path d="M22 30.5 l3-2.5 h3 v16.5 h-4 v-11.2 l-2 1.2 z" fill="#121110"/>
        <path d="M31 30.5 l3-2.5 h3 v16.5 h-4 v-11.2 l-2 1.2 z" fill="#121110"/>
      </svg>
    </div>
  );
};
