import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Coffee, PartyPopper, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { money, type TableId, tableById } from "@/lib/once-game";

export interface DrawData {
  roundId: number;
  table: TableId;
  winningTicket: number; // 1 a 11
  winnerAddress: string;
  isWinner: boolean;
  prize: number;
  txHash?: string;
}

export function DrawModal({
  draw,
  onClose,
}: {
  draw: DrawData | null;
  onClose: () => void;
}) {
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(true);

  const targetTicket = draw ? draw.winningTicket - 1 : 0; // 0-indexado para la ruleta
  const config = draw ? tableById(draw.table) : { emoji: "☕", name: "Once de Campo" };

  useEffect(() => {
    if (!draw) return;

    setIsSpinning(true);
    let current = 0;
    const speed = 70;
    let laps = 0;
    const maxLaps = 3;

    const interval = setInterval(() => {
      current = (current + 1) % 11;
      setHighlightedIndex(current);

      if (current === 0) laps++;

      if (laps >= maxLaps && current === targetTicket) {
        clearInterval(interval);
        setIsSpinning(false);

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#F59E0B", "#10B981", "#FEF3C7"],
        });
      }
    }, speed);

    return () => clearInterval(interval);
  }, [draw, targetTicket]);

  if (!draw) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-[#1C1A17] border border-[#2C2824] p-6 text-center text-[#FEF3C7] shadow-2xl space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
          {isSpinning ? (
            <Coffee className="w-7 h-7 animate-bounce" />
          ) : draw.isWinner ? (
            <PartyPopper className="w-7 h-7 text-[#10B981]" />
          ) : (
            <Trophy className="w-7 h-7 text-[#F59E0B]" />
          )}
        </div>

        <div>
          <h3 className="text-2xl font-bold">
            {isSpinning
              ? "¡Sirviendo el Sorteo!"
              : draw.isWinner
              ? "¡Felicitaciones, Ganaste!"
              : "¡Tenemos Ganador!"}
          </h3>
          <p className="text-xs text-[#A8A29E] font-mono mt-1">
            {config.emoji} {config.name} · Ronda N° {draw.roundId}
          </p>
        </div>

        {/* Ruleta interactiva 1 al 11 */}
        <div className="grid grid-cols-6 sm:grid-cols-11 gap-2 my-4">
          {Array.from({ length: 11 }).map((_, i) => {
            const isWinnerBox = !isSpinning && i === targetTicket;
            const isCursor = isSpinning && i === highlightedIndex;

            return (
              <div
                key={i}
                className={`aspect-square rounded-xl flex items-center justify-center font-mono font-bold text-sm border transition-all ${
                  isWinnerBox
                    ? "bg-[#10B981] text-black border-[#10B981] scale-110 shadow-lg shadow-[#10B981]/40 ring-2 ring-[#10B981]"
                    : isCursor
                    ? "bg-[#F59E0B] text-black border-[#F59E0B] scale-105"
                    : "bg-[#121110] text-[#57534E] border-[#2C2824]"
                }`}
              >
                {i + 1}
              </div>
            );
          })}
        </div>

        {!isSpinning && (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            <div className="p-4 rounded-2xl bg-[#121110] border border-[#2C2824] space-y-1">
              <p className="text-[11px] text-[#A8A29E] uppercase tracking-wider">
                Boleto Ganador: #{draw.winningTicket}
              </p>
              <p className="font-mono text-base font-bold text-[#FEF3C7] break-all">
                {draw.isWinner
                  ? "¡Tu cuenta!"
                  : `${draw.winnerAddress.slice(0, 6)}...${draw.winnerAddress.slice(-4)}`}
              </p>
              <p className="text-2xl font-mono font-extrabold text-[#10B981] pt-1">
                +{money(draw.prize)}
              </p>
              <p className="text-[11px] text-[#A8A29E]">
                Premio pagado automáticamente on-chain en Stellar
              </p>
            </div>

            <Button
              size="lg"
              className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-black font-semibold rounded-2xl gap-2"
              onClick={onClose}
            >
              <Sparkles className="w-4 h-4" />
              Siguiente Ronda
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
