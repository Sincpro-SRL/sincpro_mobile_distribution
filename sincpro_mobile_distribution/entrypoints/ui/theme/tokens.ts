import type { ThemeTokens } from "@sincpro/mobile-ui/theme/types";

/**
 * ============================================================================
 * DISTRIBUTION DOMAIN - THEME TOKENS
 * ============================================================================
 *
 * Tema claro para el dominio de Distribución.
 * Sistema simplificado y semántico.
 */

export const DISTRIBUTION_THEME: ThemeTokens = {
  name: "distribution",

  // Colores primarios (Tailwind palette - más sofisticados)
  primary: "#2563EB", // Tailwind blue-600 - color principal
  secondary: "#6B7280", // Tailwind gray-500 - botones secundarios, bajo perfil
  accent: "#F97316", // Tailwind orange-500 - color de acento, highlights

  // Fondos (Tailwind gray scale)
  bg: {
    page: "#F9FAFB", // Tailwind gray-50
    card: "#FFFFFF", // Blanco puro
    popover: "#FFFFFF", // Dropdowns, tooltips
    muted: "#F3F4F6", // Tailwind gray-100
    accent: "#DBEAFE", // Tailwind blue-100
    hover: "#F3F4F6", // Tailwind gray-100
    disabled: "#F9FAFB", // Tailwind gray-50
  },

  // Textos (Tailwind gray scale)
  text: {
    primary: "#111827", // Tailwind gray-900
    secondary: "#6B7280", // Tailwind gray-500
    tertiary: "#9CA3AF", // Tailwind gray-400
    muted: "#6B7280", // Tailwind gray-500
    accent: "#1E40AF", // Tailwind blue-800
    inverse: "#FFFFFF", // Blanco
    disabled: "#D1D5DB", // Tailwind gray-300
    onPrimary: "#FFFFFF", // Texto sobre primary (azul)
    onSecondary: "#FFFFFF", // Texto sobre secondary (gris)
    onAccent: "#FFFFFF", // Texto sobre accent (naranja)
    onDanger: "#FFFFFF", // Texto sobre danger
    onSuccess: "#FFFFFF", // Texto sobre success
  },
  // Iconos (Tailwind gray scale)
  icon: {
    primary: "#111827", // Tailwind gray-900
    secondary: "#6B7280", // Tailwind gray-500
    tertiary: "#9CA3AF", // Tailwind gray-400
    inverse: "#FFFFFF", // Blanco
    disabled: "#D1D5DB", // Tailwind gray-300
  },
  // Bordes (Tailwind gray scale)
  border: {
    default: "#E5E7EB", // Tailwind gray-200
    light: "#F3F4F6", // Tailwind gray-100
    strong: "#D1D5DB", // Tailwind gray-300
    focus: "#2563EB", // Tailwind blue-600
  },

  // Estados semánticos (Tailwind palette)
  success: "#10B981", // Tailwind emerald-500
  warning: "#F97316", // Tailwind orange-500
  danger: "#EF4444", // Tailwind red-500
  info: "#2563EB", // Tailwind blue-600

  // Estados semánticos - Versiones claras (Tailwind *-100)
  successLight: "#D1FAE5", // Tailwind emerald-100
  warningLight: "#FFEDD5", // Tailwind orange-100
  dangerLight: "#FEE2E2", // Tailwind red-100
  infoLight: "#DBEAFE", // Tailwind blue-100

  // Focus & Input
  ring: "#2563EB", // Tailwind blue-600
  input: "#E5E7EB", // Tailwind gray-200

  // Gradientes (basados en Tailwind)
  gradient: {
    primary: ["#3B82F6", "#1D4ED8"], // blue-500 → blue-700
    accent: ["#FB923C", "#EA580C"], // orange-400 → orange-600 (accent)
  },

  // Sombras (React Native)
  shadow: {
    sm: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.15,
      shadowRadius: 15,
      elevation: 5,
    },
  },
};
