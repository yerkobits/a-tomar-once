import React from "react";
import { ShieldAlert, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TicketLimitModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[#1C1A17] border border-[#F59E0B]/40 p-6 text-[#FEF3C7] shadow-2xl space-y-4 text-center">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#A8A29E] hover:text-[#FEF3C7] transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícono */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
          <ShieldAlert className="w-7 h-7" />
        </div>

        {/* Título */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[#FEF3C7]">
            Máximo 5 boletos por jugador
          </h3>
          <p className="text-xs text-[#F59E0B] font-semibold uppercase tracking-wider">
            Regla de Once Compartida
          </p>
        </div>

        {/* Explicación amigable */}
        <div className="p-4 rounded-2xl bg-[#121110] border border-[#2C2824] text-xs text-[#D6D3D1] space-y-2.5 text-left leading-relaxed">
          <p>
            Para asegurar un <strong className="text-[#FEF3C7]">juego justo y comunitario</strong>, ningún jugador puede acaparar más de la mitad de la mesa en una misma ronda.
          </p>
          <div className="flex items-start gap-2 pt-1 text-[#A8A29E]">
            <Users className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
            <span>
              Cada mesa debe compartirse entre al menos <strong className="text-[#FEF3C7]">2 o 3 participantes distintos</strong> para que la once se sirva y se active el sorteo.
            </span>
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold rounded-2xl"
        >
          ¡Entendido, dejaré para otros!
        </Button>
      </div>
    </div>
  );
};
