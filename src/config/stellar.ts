import { Networks, rpc } from "@stellar/stellar-sdk";

export const CONTRACT_ID = "CCDYBHGDBARMUXBH6NYP3PJ3QP255OMEVIKLLJAHXCOVRAXZUUDCNJSH";
// Contrato de XLM nativo en Testnet
export const XLM_CONTRACT_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

export const RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const server = new rpc.Server(RPC_URL);
