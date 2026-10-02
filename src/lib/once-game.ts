export type TableId = "campo" | "tradicional" | "reina";

export interface TableConfig {
  id: TableId;
  name: string;
  subtitle: string;
  price: number;
  prize: number;
  emoji: string;
}

export const TABLES: TableConfig[] = [
  { id: "campo", name: "Once de Campo", subtitle: "Económica", price: 1, prize: 10, emoji: "☕" },
  { id: "tradicional", name: "Once Tradicional", subtitle: "Estándar", price: 10, prize: 100, emoji: "🍪" },
  { id: "reina", name: "Once Reina", subtitle: "High Roller", price: 100, prize: 1000, emoji: "🥑" },
];

export const TICKETS_PER_ROUND = 11;

export function tableById(id: TableId): TableConfig {
  return TABLES.find((t) => t.id === id) || TABLES[0];
}

export function money(amount: number): string {
  return `${amount.toLocaleString("es-CL")} XLM`;
}
