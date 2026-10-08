import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/once/Header";
import { Button } from "@/components/ui/button";
import { TABLES, TICKETS_PER_ROUND, TableId, tableById, money } from "@/lib/once-game";
import { useOnceSoroban } from "@/hooks/useOnceSoroban";
import { DrawModal, type DrawData } from "@/components/once/DrawModal";
import { HistoryTable, type HistoryItem } from "@/components/once/HistoryTable";
import { CommunityInfoModal } from "@/components/once/CommunityInfoModal";
import { TicketLimitModal } from "@/components/once/TicketLimitModal";
import { Check, Loader2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import { CONTRACT_ID, RPC_URL } from "@/config/stellar";
import { scValToNative, xdr } from "@stellar/stellar-sdk";

const ROOM_MAP: Record<TableId, number> = { campo: 0, tradicional: 1, reina: 2 };
const HISTORY_KEY = "once_stellar_verified_history_v4";
const MAX_TICKETS_PER_PLAYER = 5;

const getXdrString = (item: any): string => {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item === "object" && item.xdr) return item.xdr;
  return "";
};

export default function App() {
  const [activeTable, setActiveTable] = useState<TableId>("campo");
  const [selected, setSelected] = useState<number[]>([]);
  const [currentDraw, setCurrentDraw] = useState<DrawData | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved =
          localStorage.getItem(HISTORY_KEY) ||
          localStorage.getItem("once_stellar_verified_history_v2") ||
          localStorage.getItem("once_stellar_verified_history_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 5);
        }
      } catch (_) {}
    }
    return [];
  });

  const roomId = ROOM_MAP[activeTable];
  const { address, isConnected, connectWallet, roomData, ticketsOwners, isProcessing, buyTickets, refetchAll } =
    useOnceSoroban(roomId);

  const config = tableById(activeTable);
  const totalCost = selected.length * config.price;
  const lastRoundRef = useRef<number>(0);
  const initialSyncDoneRef = useRef<boolean>(false);

  const myCurrentTicketsCount = ticketsOwners.filter(
    (owner) => owner && address && owner.toLowerCase() === address.toLowerCase()
  ).length;

  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 5)));
      } catch (_) {}
    }
  }, [history]);

  // Consulta de eventos en Soroban
  const fetchBlockchainEvents = async (triggerModal = false, expectedRound?: number, fallbackHash?: string) => {
    const maxAttempts = triggerModal ? 8 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, 1200));
      }

      try {
        const ledgerRes = await fetch(RPC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getLatestLedger" }),
        });
        const ledgerJson = await ledgerRes.json();
        const currentSequence = ledgerJson?.result?.sequence;
        if (!currentSequence) continue;

        let startLedger = Math.max(1, currentSequence - 5000);

        const payload = {
          jsonrpc: "2.0",
          id: 1,
          method: "getEvents",
          params: {
            startLedger,
            filters: [
              {
                type: "contract",
                contractIds: [CONTRACT_ID],
              },
            ],
          },
        };

        const res = await fetch(RPC_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        const events = data?.result?.events || [];
        const discoveredItems: HistoryItem[] = [];
        let matchingDraw: DrawData | null = null;

        for (let i = 0; i < events.length; i++) {
          const ev = events[i];
          try {
            if (!ev.topic || ev.topic.length < 3) continue;

            const topic0Base64 = getXdrString(ev.topic[0]);
            if (!topic0Base64) continue;
            const topic0 = scValToNative(xdr.ScVal.fromXDR(topic0Base64, "base64"));
            if (String(topic0).toLowerCase() !== "draw") continue;

            const topic1Base64 = getXdrString(ev.topic[1]);
            const topic2Base64 = getXdrString(ev.topic[2]);
            const eventRoomId = Number(scValToNative(xdr.ScVal.fromXDR(topic1Base64, "base64")));
            const eventRoundId = Number(scValToNative(xdr.ScVal.fromXDR(topic2Base64, "base64")));

            const valBase64 = getXdrString(ev.value);
            if (!valBase64) continue;
            const nativeVal: any = scValToNative(xdr.ScVal.fromXDR(valBase64, "base64"));

            if (Array.isArray(nativeVal) && nativeVal.length === 3) {
              const winTicket = Number(nativeVal[0]);
              const winner = String(nativeVal[1]);
              const prizeStroops = Number(nativeVal[2]);
              const prizeXLM = prizeStroops / 10_000_000;
              const isMine = !!(address && winner.toLowerCase() === address.toLowerCase());
              const cleanHash = (ev.txHash || ev.transactionHash || fallbackHash || "").toLowerCase();

              const tableKey: TableId = eventRoomId === 1 ? "tradicional" : eventRoomId === 2 ? "reina" : "campo";
              const eventTime = ev.ledgerClosedAt ? new Date(ev.ledgerClosedAt).getTime() : Date.now();

              const historyEntry: HistoryItem = {
                id: eventRoundId,
                table: tableKey,
                winningTicket: winTicket,
                winner: winner,
                prize: prizeXLM,
                hash: cleanHash,
                isMine: isMine,
                at: eventTime,
              };

              discoveredItems.push(historyEntry);

              if (triggerModal && (!expectedRound || eventRoundId === expectedRound)) {
                matchingDraw = {
                  roundId: eventRoundId,
                  table: tableKey,
                  winningTicket: winTicket,
                  winnerAddress: winner,
                  isWinner: isMine,
                  prize: prizeXLM,
                  txHash: cleanHash,
                };
              }
            }
          } catch (_) {}
        }

        if (triggerModal && expectedRound && !matchingDraw) {
          continue;
        }

        if (discoveredItems.length > 0) {
          setHistory((prev) => {
            const combined = [...discoveredItems, ...prev];
            const unique = combined.filter(
              (v, idx, arr) => arr.findIndex((t) => t.id === v.id && t.table === v.table) === idx
            );
            return unique.sort((a, b) => b.id - a.id).slice(0, 5);
          });
        }

        if (matchingDraw) {
          setCurrentDraw(matchingDraw);
        }

        break;
      } catch (e) {
        console.warn("Sondeando eventos...", e);
      } finally {
        setIsLoadingHistory(false);
      }
    }
  };

  // Carga inicial del historial en silencio (sin abrir modales)
  useEffect(() => {
    fetchBlockchainEvents(false);
  }, [CONTRACT_ID, address]);

  // Sincronización inteligente de rondas: NO abre modales al cargar la página
  useEffect(() => {
    if (!roomData.isLoaded) return;

    // Primera vez que llegan datos reales de la blockchain: solo sincronizar lastRoundRef
    if (!initialSyncDoneRef.current) {
      initialSyncDoneRef.current = true;
      lastRoundRef.current = roomData.roundId;
      return;
    }

    // Solo si la ronda avanza estando ya en vivo en la página:
    if (roomData.roundId > lastRoundRef.current) {
      const finishedRound = lastRoundRef.current;
      lastRoundRef.current = roomData.roundId;
      fetchBlockchainEvents(true, finishedRound);
    }
  }, [roomData.isLoaded, roomData.roundId]);

  const toggleTicket = (idx: number) => {
    if (ticketsOwners[idx]) return;

    const isCurrentlySelected = selected.includes(idx);
    if (!isCurrentlySelected) {
      if (myCurrentTicketsCount + selected.length >= MAX_TICKETS_PER_PLAYER) {
        setLimitModalOpen(true);
        return;
      }
    }

    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleBuy = async () => {
    if (selected.length === 0) return;

    if (myCurrentTicketsCount + selected.length > MAX_TICKETS_PER_PLAYER) {
      setLimitModalOpen(true);
      return;
    }

    const willCompleteRound = roomData.ticketsSold + selected.length === TICKETS_PER_ROUND;
    const roundBeingCompleted = roomData.roundId;

    try {
      const res = await buyTickets(selected.map((i) => i + 1));

      if (res.success) {
        setSelected([]);

        if (willCompleteRound) {
          toast.loading("¡Mesa completa! Obteniendo ganador del sorteo...", { id: "stellar-tx" });
          await fetchBlockchainEvents(true, roundBeingCompleted, res.hash);
          toast.dismiss("stellar-tx");
        }
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("5 boletos") || msg.includes("UnreachableCodeReached") || msg.includes("InvalidAction")) {
        setLimitModalOpen(true);
      } else {
        toast.error(`Error: ${msg}`, { id: "stellar-tx" });
      }
    }
  };

  return (
    <div className="min-h-screen">
      <Header
        address={address}
        onConnect={connectWallet}
        onOpenInfoModal={() => setInfoModalOpen(true)}
      />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <section>
          <h2 className="text-3xl sm:text-4xl font-bold">
            <span className="text-[#F59E0B]">Once boletos</span>, <span className="text-[#FEF3C7]">un ganador.</span>
          </h2>
          <p className="text-sm text-[#A8A29E] mt-1">Sorteos instantáneos en XLM sobre Stellar Soroban</p>
        </section>

        {/* Selector de Mesas */}
        <div className="grid gap-3 sm:grid-cols-3">
          {TABLES.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTable(t.id); setSelected([]); }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTable === t.id
                  ? "border-[#F59E0B] bg-[#1C1A17] glow-amber"
                  : "border-[#2C2824] bg-[#1C1A17]/60 hover:border-[#F59E0B]/40"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-2xl">{t.emoji}</span>
                  <h3 className="font-semibold text-base mt-1">{t.name}</h3>
                  <p className="text-xs uppercase text-[#A8A29E]">{t.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#A8A29E]">Premio</p>
                  <p className="font-mono text-lg font-bold text-[#F59E0B]">{money(t.prize)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#A8A29E]">Boleto: {money(t.price)}</p>
            </button>
          ))}
        </div>

        {/* Tablero */}
        <section className="p-6 rounded-3xl bg-[#1C1A17] border border-[#2C2824] space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span>{config.emoji}</span> {config.name}
              </h3>
              <p className="text-xs text-[#F59E0B] font-mono">Ronda N° {roomData.roundId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#A8A29E]">Vendidos</p>
              <p className="font-mono font-bold">{roomData.ticketsSold} / {TICKETS_PER_ROUND}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-3">
            {Array.from({ length: 11 }).map((_, i) => {
              const isSelected = selected.includes(i);
              const owner = ticketsOwners[i];
              const isMine = owner && address && owner.toLowerCase() === address.toLowerCase();

              return (
                <button
                  key={i}
                  disabled={!!owner || isProcessing}
                  onClick={() => toggleTicket(i)}
                  className={`aspect-square rounded-2xl border-2 font-mono font-bold text-lg flex flex-col items-center justify-center transition-all ${
                    owner
                      ? isMine
                        ? "border-[#10B981] bg-[#10B981]/20 text-[#10B981]"
                        : "border-[#2C2824] bg-[#121110]/40 text-[#57534E] cursor-not-allowed"
                      : isSelected
                      ? "border-[#F59E0B] bg-[#F59E0B]/20 text-[#F59E0B] scale-105"
                      : "border-[#2C2824] bg-[#121110] text-[#FEF3C7] hover:border-[#F59E0B]/50"
                  }`}
                >
                  <span>{i + 1}</span>
                  {owner && !isMine && <span className="text-[9px] text-[#A8A29E]">Servida</span>}
                  {isMine && <span className="text-[9px] text-[#10B981]">Tuyo</span>}
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-[#2C2824]">
            <div>
              <p className="text-xs text-[#A8A29E]">Total a pagar</p>
              <p className="font-mono text-2xl font-bold text-[#FEF3C7]">{money(totalCost)}</p>
            </div>

            <Button
              size="lg"
              disabled={selected.length === 0 || isProcessing}
              onClick={handleBuy}
              className="min-w-[180px]"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</span>
              ) : !isConnected ? (
                "Conectar billetera"
              ) : (
                "Servir mesa"
              )}
            </Button>
          </div>
        </section>

        {/* Tabla de Rondas Históricas */}
        <HistoryTable
          history={history}
          currentAddress={address}
          isLoading={isLoadingHistory}
        />

        <footer className="text-center text-xs text-[#A8A29E] pt-8">
          Contrato Soroban (Stellar XLM):{" "}
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[#F59E0B] hover:underline"
          >
            {CONTRACT_ID}
          </a>
        </footer>
      </main>

      {/* Modal de Sorteo */}
      {currentDraw && (
        <DrawModal
          draw={currentDraw}
          onClose={() => {
            setCurrentDraw(null);
            refetchAll();
          }}
        />
      )}

      {/* Modal Informativo General */}
      <CommunityInfoModal
        open={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />

      {/* Modal Amigable de Límite de Boletos */}
      <TicketLimitModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
      />

      <Toaster richColors position="top-left" theme="dark" />
    </div>
  );
}
