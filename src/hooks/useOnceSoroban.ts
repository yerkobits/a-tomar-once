import { useState, useEffect, useCallback } from "react";
import {
  BASE_FEE,
  Operation,
  TransactionBuilder,
  rpc,
  scValToNative,
  xdr,
  Address,
} from "@stellar/stellar-sdk";
import { isConnected, requestAccess, signTransaction, getNetwork } from "@stellar/freighter-api";
import { CONTRACT_ID, NETWORK_PASSPHRASE, RPC_URL, server } from "@/config/stellar";
import { toast } from "sonner";

async function waitForFreighter(timeoutMs = 1500): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (typeof window !== "undefined" && (window as any).freighter) return true;
    try {
      const conn = await isConnected();
      if (typeof conn === "boolean" ? conn : (conn as any)?.isConnected) return true;
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

// Sondeo directo por JSON-RPC (evita el fallo de deserialización XDR "Bad union switch: 4")
async function pollTransactionStatus(hash: string): Promise<"SUCCESS" | "FAILED"> {
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "getTransaction",
    params: { hash },
  };

  const maxAttempts = 30; // 30 intentos * 1.5s = 45s de margen
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const status = data?.result?.status;

      if (status === "SUCCESS") return "SUCCESS";
      if (status === "FAILED") return "FAILED";
    } catch (e) {
      console.warn("Sondeando estado de transacción...", e);
    }
  }
  throw new Error("Tiempo de espera agotado esperando confirmación en Stellar");
}

export function useOnceSoroban(roomId: number = 0) {
  const [address, setAddress] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [roomData, setRoomData] = useState<{ roundId: number; ticketsSold: number; price: number }>({
    roundId: 1,
    ticketsSold: 0,
    price: 1,
  });
  const [ticketsOwners, setTicketsOwners] = useState<(string | null)[]>(Array(11).fill(null));

  const connectWallet = async () => {
    try {
      const available = await waitForFreighter();
      if (!available) {
        toast.error("No se detectó Freighter. Asegúrate de tener la extensión habilitada.");
        return;
      }

      const access = await requestAccess();
      const userAddress = typeof access === "string" ? access : (access as any)?.address;

      if (userAddress) {
        setAddress(userAddress);
        toast.success(`Conectado: ${userAddress.slice(0, 4)}...${userAddress.slice(-4)}`);
      } else {
        toast.error("Acceso denegado en Freighter");
      }
    } catch (e: any) {
      toast.error(e?.message || "Error al conectar Freighter");
    }
  };

  const fetchRoomState = useCallback(async () => {
    if (!CONTRACT_ID || CONTRACT_ID.includes("PEGA_AQUI")) return;

    try {
      const dummySource = address || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
      const sourceAccount = await server.getAccount(dummySource).catch(() => ({
        accountId: () => dummySource,
        sequenceNumber: () => "0",
        incrementSequenceNumber: () => {},
      }));

      const tx = new TransactionBuilder(sourceAccount as any, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.invokeContractFunction({
            contract: CONTRACT_ID,
            function: "get_room",
            args: [xdr.ScVal.scvU32(roomId)],
          })
        )
        .setTimeout(30)
        .build();

      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
        const raw: any = scValToNative(sim.result.retval);
        setRoomData({
          roundId: Number(raw.round_id),
          ticketsSold: Number(raw.tickets_sold),
          price: Number(raw.ticket_price) / 10_000_000,
        });

        const mapped = Array(11).fill(null);
        if (raw.participants) {
          if (raw.participants instanceof Map) {
            for (let seat = 1; seat <= 11; seat++) {
              const owner = raw.participants.get(seat) || raw.participants.get(BigInt(seat));
              if (owner) mapped[seat - 1] = String(owner);
            }
          } else if (Array.isArray(raw.participants)) {
            for (const item of raw.participants) {
              if (item && item.key !== undefined) {
                const seat = Number(item.key);
                if (seat >= 1 && seat <= 11) mapped[seat - 1] = String(item.val);
              }
            }
          } else if (typeof raw.participants === "object") {
            for (let seat = 1; seat <= 11; seat++) {
              const owner = raw.participants[seat] || raw.participants[String(seat)];
              if (owner) mapped[seat - 1] = String(owner);
            }
          }
        }
        setTicketsOwners(mapped);
      }
    } catch (err) {
      // Ignorar errores de sondeo mientras se inicializa
    }
  }, [roomId, address]);

  useEffect(() => {
    fetchRoomState();
    const interval = setInterval(fetchRoomState, 4000);
    return () => clearInterval(interval);
  }, [fetchRoomState]);

  const buyTickets = async (ticketNumbers: number[]) => {
    if (!address) {
      await connectWallet();
      return false;
    }

    try {
      setIsProcessing(true);
      toast.loading("Simulando compra en Soroban...", { id: "stellar-tx" });

      const sourceAccount = await server.getAccount(address);
      const ticketsVector = xdr.ScVal.scvVec(
        ticketNumbers.map((num) => xdr.ScVal.scvU32(num))
      );

      const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.invokeContractFunction({
            contract: CONTRACT_ID,
            function: "buy_tickets",
            args: [
              new Address(address).toScVal(),
              xdr.ScVal.scvU32(roomId),
              ticketsVector,
            ],
          })
        )
        .setTimeout(30)
        .build();

      const simulation = await server.simulateTransaction(tx);

      if (!rpc.Api.isSimulationSuccess(simulation)) {
        console.error("Soroban Simulation Failed:", simulation);
        const detailedError = (simulation as any)?.error || "Error al simular compra";
        throw new Error(detailedError);
      }

      const preparedTx = rpc.assembleTransaction(tx, simulation).build();
      toast.loading("Confirma la transacción en Freighter...", { id: "stellar-tx" });

      const signed = await signTransaction(preparedTx.toXDR(), {
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      const signedXdr = typeof signed === "string" ? signed : (signed as any)?.signedTxXdr;
      if (!signedXdr) throw new Error((signed as any)?.error?.message || "Firma cancelada");

      toast.loading("Enviando a la red Stellar...", { id: "stellar-tx" });
      const sent = await server.sendTransaction(
        TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE)
      );

      if (sent.status === "ERROR") throw new Error("Transacción rechazada por el ledger");

      toast.loading("Esperando confirmación del ledger...", { id: "stellar-tx" });
      
      // Sondeo limpio por JSON-RPC
      const result = await pollTransactionStatus(sent.hash);

      if (result === "SUCCESS") {
        toast.success("¡Boletos servidos con éxito!", { id: "stellar-tx" });
        fetchRoomState();
        return true;
      } else {
        throw new Error("Transacción falló al procesarse en el ledger");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message || String(err)}`, { id: "stellar-tx" });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    address,
    isConnected: !!address,
    connectWallet,
    roomData,
    ticketsOwners,
    isProcessing,
    buyTickets,
    refetchAll: fetchRoomState,
  };
}
