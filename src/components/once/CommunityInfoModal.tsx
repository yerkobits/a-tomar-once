import React from "react";
import {
  Sparkles,
  Users,
  Coins,
  ShieldCheck,
  HeartHandshake,
  X,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTRACT_ID } from "@/config/stellar";

export const CommunityInfoModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#1C1A17] border border-[#2C2824] p-6 text-[#FEF3C7] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#A8A29E] hover:text-[#FEF3C7] transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="space-y-1 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-xs text-[#F59E0B] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Transparencia & Comunidad
          </div>
          <h2 className="text-2xl font-bold text-[#FEF3C7]">
            ¿Cómo se juega "A Tomar Once"?
          </h2>
          <p className="text-xs text-[#A8A29E]">
            Un juego rápido, descentralizado y con espíritu de once compartida.
          </p>
        </div>

        {/* 1. Mecánica del Juego */}
        <div className="space-y-2.5 text-left">
          <h3 className="text-sm font-semibold text-[#F59E0B] flex items-center gap-2">
            <Coins className="w-4 h-4" />
            1. Regla de los 11 Boletos (Instantáneo)
          </h3>
          <p className="text-xs text-[#D6D3D1] leading-relaxed">
            Cada mesa tiene exactamente <strong className="text-[#FEF3C7]">11 tazas (boletos)</strong>. En el segundo exacto en que se sirve el boleto #11, el contrato inteligente ejecuta el sorteo de forma 100% autónoma en Stellar Soroban.
          </p>
          <div className="p-3 rounded-2xl bg-[#121110] border border-[#2C2824] flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-[#A8A29E]">Premio al Ganador:</span>
              <p className="text-[#10B981] font-bold text-sm">10 Boletos (90.9%)</p>
            </div>
            <div className="text-right">
              <span className="text-[#A8A29E]">Fondo de la Mesa:</span>
              <p className="text-[#F59E0B] font-bold text-sm">1 Boleto (9.1%)</p>
            </div>
          </div>
        </div>

        {/* 2. El 1/11: Fondo Comunitario (Desmitificando el lucro ciego) */}
        <div className="p-4 rounded-2xl bg-[#121110] border border-[#F59E0B]/30 space-y-2 text-left">
          <div className="flex items-center gap-2 text-[#F59E0B] font-bold text-sm">
            <HeartHandshake className="w-4 h-4 text-[#F59E0B]" />
            <span>¿A dónde va el 1/11? Fondo Comunitario</span>
          </div>
          <p className="text-xs text-[#D6D3D1] leading-relaxed">
            Existe la falsa creencia de que en los juegos cripto el desarrollador cobra comisiones para ganar sin jugar. En <strong className="text-[#FEF3C7]">A Tomar Once</strong> el 1/11 es un <strong className="text-[#F59E0B]">Fondo Solidario y de Reinversión</strong>:
          </p>
          <ul className="text-xs text-[#A8A29E] space-y-1.5 list-disc pl-4">
            <li>
              <strong className="text-[#FEF3C7]">Recompra y Boletos de Regalo:</strong> Este fondo se utiliza para financiar boletos sorpresa en mesas vacías ("invitar la once") y premiar a jugadores activos para que nunca pare la ronda.
            </li>
            <li>
              <strong className="text-[#FEF3C7]">Mantenimiento de Infraestructura:</strong> Cubre el costo de los servidores, nodos RPC y futuras auditorías del Smart Contract.
            </li>
            <li>
              <strong className="text-[#FEF3C7]">Espíritu de Once:</strong> Como en una once familiar donde todos colaboran para que la mesa esté servida, ese 1/11 vuelve a los jugadores para que la tetera siga hirviendo.
            </li>
          </ul>
        </div>

        {/* 3. Aleatoriedad en Blockchain */}
        <div className="space-y-1.5 text-left text-xs text-[#D6D3D1]">
          <div className="flex items-center gap-1.5 font-semibold text-[#10B981]">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>Aleatoriedad Criptográfica Inmanipulable</span>
          </div>
          <p className="text-[#A8A29E] leading-relaxed">
            El boleto ganador se determina mediante el generador de números aleatorios criptográfico de Soroban (<code className="text-[#F59E0B]">env.prng()</code>). Nadie (ni los jugadores ni el creador del contrato) puede manipular ni predecir el resultado.
          </p>
        </div>

        {/* Footer del Modal */}
        <div className="pt-2 border-t border-[#2C2824] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-mono text-[#F59E0B] hover:underline inline-flex items-center gap-1"
          >
            <span>Ver contrato auditado</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <Button
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold rounded-xl px-5"
          >
            ¡Entendido, a jugar!
          </Button>
        </div>
      </div>
    </div>
  );
};
