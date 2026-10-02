import React from "react";
import { History, ExternalLink } from "lucide-react";
import { tableById, money, type TableId } from "@/lib/once-game";

export interface HistoryItem {
  id: number;
  table: TableId;
  winningTicket: number;
  winner: string;
  prize: number;
  hash?: string;
  isMine: boolean;
  at: number;
}

function timeAgo(timestamp: number) {
  const sec = Math.floor((Date.now() - timestamp) / 1000);
  if (sec < 60) return "hace unos seg";
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min}m`;
  return `hace ${Math.floor(min / 60)}h`;
}

export const HistoryTable: React.FC<{ history: HistoryItem[] }> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <section className="p-6 rounded-3xl bg-[#1C1A17] border border-[#2C2824] text-center text-sm text-[#A8A29E]">
        <History className="mx-auto w-8 h-8 opacity-40 mb-2" />
        <p>Aún no hay rondas registradas en esta sesión.</p>
      </section>
    );
  }

  return (
    <section className="p-6 rounded-3xl bg-[#1C1A17] border border-[#2C2824] overflow-hidden space-y-4">
      <div className="flex items-center gap-2">
        <History className="w-5 h-5 text-[#F59E0B]" />
        <h3 className="text-lg font-semibold text-[#FEF3C7]">Rondas recientes (Stellar Testnet)</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-[#2C2824] text-[#A8A29E] font-mono">
              <th className="pb-3 font-medium">Ronda</th>
              <th className="pb-3 font-medium">Mesa</th>
              <th className="pb-3 font-medium text-center">Boleto</th>
              <th className="pb-3 font-medium">Ganador</th>
              <th className="pb-3 font-medium">Premio</th>
              <th className="pb-3 font-medium">Explorer</th>
              <th className="pb-3 font-medium text-right">Tiempo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2C2824]/50">
            {history.map((entry, idx) => {
              const cfg = tableById(entry.table);
              const txUrl = entry.hash
                ? `https://stellar.expert/explorer/testnet/tx/${entry.hash}`
                : `https://stellar.expert/explorer/testnet/account/${entry.winner}`;

              return (
                <tr key={`${entry.id}-${idx}`} className="hover:bg-[#2C2824]/30 transition-colors">
                  <td className="py-3 font-mono font-bold text-[#FEF3C7]">N° {entry.id}</td>
                  <td className="py-3 font-medium">
                    <span className="mr-1.5">{cfg.emoji}</span>
                    <span>{cfg.name}</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className="inline-flex w-6 h-6 items-center justify-center rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] font-mono font-bold text-xs">
                      {entry.winningTicket}
                    </span>
                  </td>
                  <td className="py-3 font-mono">
                    {entry.isMine ? (
                      <span className="rounded-md bg-[#10B981]/20 px-2 py-0.5 text-xs font-bold text-[#10B981]">
                        ¡Tú!
                      </span>
                    ) : (
                      <span className="text-[#A8A29E]">{entry.winner.slice(0, 4)}...{entry.winner.slice(-4)}</span>
                    )}
                  </td>
                  <td className="py-3 font-mono font-bold text-[#10B981]">
                    +{money(entry.prize)}
                  </td>
                  <td className="py-3">
                    <a
                      href={txUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-xs text-[#F59E0B] hover:underline"
                    >
                      <span>Ver TX</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
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
