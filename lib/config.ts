export const PRECIOS_CARTON = {
  PEQUENO: 13000,
  MEDIANO: 15000,
  GRANDE: 18000,
  JUMBO: 20000,
} as const;

export type TipoCartonType = keyof typeof PRECIOS_CARTON;

export const ETIQUETAS_CARTON: Record<TipoCartonType, string> = {
  PEQUENO: "Pequeño (50-55gr)",
  MEDIANO: "Mediano (56-61gr)",
  GRANDE: "Grande (62-67gr)",
  JUMBO: "Jumbo (68-90gr)",
};
