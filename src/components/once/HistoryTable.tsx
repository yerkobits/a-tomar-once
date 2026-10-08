import React from "react";
import { History, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { tableById, money, type TableId } from "@/lib/once-game";

export interface HistoryItem {
  id: number;
  table: TableId;
  winningTicket: number;
  winner: string;
  prize: number;
  hash: string;
  isMine: boolean;
  at: number;
}

function timeAgo(timestamp: number) {
  const sec = Math.floor((Date.now() - timestamp) / 1000);
  if (sec < 60) return "hace unos seg";
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min}m`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export const HistoryTable: React.FC<{
  history: HistoryItem[];
  currentAddress?: string;
  isLoading?: boolean;
}> = ({ history, currentAddress, isLoading = false }) => {
  if (isLoading && (!history || history.length === 0)) {
    return (
      <section className="p-6 rounded-3xl bg-[#1C1A17] border border-[#2C2824] text-center text-sm text-[#A8A29E] space-y-2">
        <Loader2 className="mx-auto w-6 h-6 animate-spin text-[#F59E0B]" />
        <p>Consultando sorteos en la red Stellar...</p>
      </section>
    );
  }

  if (!history || history.length === 0) {
    return (
      <section className="p-6 rounded-3xl bg-[#1C1A17] border border-[#2C2824] text-center text-sm text-[#A8A29E] space-y-2">
        <History className="mx-auto w-8 h-8 opacity-40 mb-1" />
        <p>Aún no hay sorteos registrados en este contrato. ¡Sé el primero en jugar!</p>
      </section>
    );
  }

  const displayHistory = history.slice(0, 5);

  return (
    <section className="p-6 rounded-3xl bg-[#1C1A17] border border-[#2C2824] overflow-hidden space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#F59E0B]" />
          <h3 className="text-lg font-semibold text-[#FEF3C7]">Últimos 5 Sorteos (On-Chain)</h3>
        </div>
        <span className="text-[11px] font-mono text-[#10B981] flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Sincronizado con Stellar
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[#2C2824] text-[#A8A29E] font-mono">
              <th className="pb-3 font-medium">Ronda</th>
              <th className="pb-3 font-medium">Mesa</th>
              <th className="pb-3 font-medium text-center">Boleto Ganador</th>
              <th className="pb-3 font-medium">Ganador</th>
              <th className="pb-3 font-medium">Premio</th>
              <th className="pb-3 font-medium">Tx Hash (Explorer)</th>
              <th className="pb-3 font-medium text-right">Tiempo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2C2824]/50">
            {displayHistory.map((entry) => {
              const cfg = tableById(entry.table);
              const isUserWinner =
                entry.isMine ||
                (!!currentAddress && entry.winner.toLowerCase() === currentAddress.toLowerCase());

              const stellarExpertUrl = `https://stellar.expert/explorer/testnet/tx/${entry.hash}`;
              const horizonUrl = `https://horizon-testnet.stellar.org/transactions/${entry.hash}`;

              return (
                <tr key={`${entry.table}-${entry.id}`} className="hover:bg-[#2C2824]/30 transition-colors">
                  <td className="py-3 font-mono font-bold text-[#FEF3C7]">N° {entry.id}</td>
                  <td className="py-3 font-medium">
                    <span className="mr-1.5">{cfg.emoji}</span>
                    <span>{cfg.name}</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="inline-flex w-7 h-7 items-center justify-center rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] font-mono font-bold text-xs">
                      #{entry.winningTicket}
                    </span>
                  </td>
                  <td className="py-3 font-mono">
                    {isUserWinner ? (
                      <span className="rounded-md bg-[#10B981]/20 px-2 py-0.5 text-xs font-bold text-[#10B981]">
                        ¡Tú!
                      </span>
                    ) : (
                      <span className="text-[#A8A29E]">
                        {entry.winner.slice(0, 4)}...{entry.winner.slice(-4)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 font-mono font-bold text-[#10B981]">
                    +{money(entry.prize)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <a
                        href={stellarExpertUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Ver en StellarExpert"
                        className="text-[#F59E0B] hover:underline inline-flex items-center gap-1 font-bold"
                      >
                        <span>{entry.hash.slice(0, 6)}...{entry.hash.slice(-4)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={horizonUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Verificación instantánea en nodo Horizon"
                        className="text-[10px] text-[#A8A29E] hover:text-[#FEF3C7] border border-[#2C2824] px-1.5 py-0.5 rounded"
                      >
                        API
                      </a>
                    </div>
                  </td>
                  <td className="py-3 text-right font-mono text-xs text-[#A8A29E]">
                    {timeAgo(entry.at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
