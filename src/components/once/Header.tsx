import React from 'react';
import { HelpCircle, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoIcon } from './LogoIcon';

interface HeaderProps {
  address?: string;
  onConnect?: () => void;
  onOpenInfoModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ address, onConnect, onOpenInfoModal }) => {
  return (
    <header className="w-full border-b border-[#2C2824] bg-[#121110]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo con el mismo ícono del favicon */}
        <div className="flex items-center gap-3">
          <LogoIcon className="w-10 h-10 border border-[#2C2824]" />
          <div>
            <h1 className="font-bold text-lg text-[#FEF3C7] tracking-tight leading-none">
              A Tomar Once
            </h1>
            <p className="text-[11px] text-[#A8A29E]">SOROBAN · STELLAR TESTNET</p>
          </div>
        </div>

        {/* Acciones del Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botón que explica la mecánica y el fondo comunitario */}
          {onOpenInfoModal && (
            <Button
              onClick={onOpenInfoModal}
              variant="outline"
              size="sm"
              className="gap-1.5 border-[#2C2824] bg-[#1C1A17] text-[#FEF3C7] hover:bg-[#2C2824] hover:text-[#F59E0B] text-xs px-3"
            >
              <HelpCircle className="w-4 h-4 text-[#F59E0B]" />
              <span className="hidden sm:inline font-medium">¿Cómo funciona?</span>
            </Button>
          )}

          {/* Botón de billetera Freighter */}
          {address ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1C1A17] border border-[#2C2824] font-mono text-xs text-[#10B981]">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>{address.slice(0, 4)}...{address.slice(-4)}</span>
            </div>
          ) : (
            <Button
              onClick={onConnect}
              size="sm"
              className="bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold rounded-xl gap-2 cursor-pointer shadow-md"
            >
              <Wallet className="w-4 h-4" />
              <span>Conectar billetera</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
