import type { ThemeTokens } from "@sincpro/mobile-ui/theme/types";

export const DISTRIBUTION_THEME: ThemeTokens = {
  name: "distribution",

  primary: "#2563EB",
  secondary: "#6B7280",
  accent: "#F97316",

  bg: {
    page: "#F8FAFC", // slate-50 — casi blanco, sin tinte azul visible
    card: "#FFFFFF",
    popover: "#FFFFFF",
    muted: "#F1F5F9", // slate-100
    accent: "#DBEAFE", // blue-100
    hover: "#E0EFFE",
    disabled: "#F8FAFC",
  },

  text: {
    primary: "#0F172A", // slate-900
    secondary: "#475569", // slate-600
    tertiary: "#94A3B8", // slate-400
    muted: "#64748B", // slate-500
    accent: "#1E40AF", // blue-800
    inverse: "#FFFFFF",
    disabled: "#CBD5E1", // slate-300
    onPrimary: "#FFFFFF",
    onSecondary: "#FFFFFF",
    onAccent: "#FFFFFF",
    onDanger: "#FFFFFF",
    onSuccess: "#FFFFFF",
  },

  icon: {
    primary: "#0F172A",
    secondary: "#475569",
    tertiary: "#94A3B8",
    inverse: "#FFFFFF",
    disabled: "#CBD5E1",
  },

  border: {
    default: "#BFDBFE", // blue-200 — bordes con identidad
    light: "#DBEAFE", // blue-100
    strong: "#93C5FD", // blue-300
    focus: "#2563EB",
  },

  success: "#10B981",
  warning: "#F97316",
  danger: "#EF4444",
  info: "#2563EB",

  successLight: "#D1FAE5",
  warningLight: "#FFEDD5",
  dangerLight: "#FEE2E2",
  infoLight: "#DBEAFE",

  ring: "#2563EB",
  input: "#BFDBFE",

  gradient: {
    primary: ["#3B82F6", "#1D4ED8"],
    accent: ["#FB923C", "#EA580C"],
  },

  shadow: {
    sm: {
      shadowColor: "#1E40AF",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#1E40AF",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: "#1E40AF",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.18,
      shadowRadius: 15,
      elevation: 5,
    },
  },
};

export const DISTRIBUTION_DARK_THEME: ThemeTokens = {
  name: "distribution-dark",

  primary: "#3B82F6", // blue-500 — más brillante sobre fondo oscuro
  secondary: "#94A3B8", // slate-400
  accent: "#FB923C", // orange-400

  bg: {
    page: "#0F172A", // slate-900
    card: "#1E293B", // slate-800
    popover: "#1E293B",
    muted: "#334155", // slate-700
    accent: "#1E3A5F", // azul oscuro
    hover: "#334155",
    disabled: "#1E293B",
    inverse: "#F8FAFC",
  },

  text: {
    primary: "#F8FAFC", // slate-50
    secondary: "#94A3B8", // slate-400
    tertiary: "#64748B", // slate-500
    muted: "#64748B",
    accent: "#93C5FD", // blue-300
    inverse: "#0F172A",
    disabled: "#475569", // slate-600
    onPrimary: "#FFFFFF",
    onSecondary: "#0F172A",
    onAccent: "#FFFFFF",
    onDanger: "#FFFFFF",
    onSuccess: "#FFFFFF",
  },

  icon: {
    primary: "#F8FAFC",
    secondary: "#94A3B8",
    tertiary: "#64748B",
    inverse: "#0F172A",
    disabled: "#475569",
  },

  border: {
    default: "#334155", // slate-700
    light: "#1E293B", // slate-800
    strong: "#475569", // slate-600
    focus: "#3B82F6",
  },

  success: "#34D399", // emerald-400
  warning: "#FB923C", // orange-400
  danger: "#F87171", // red-400
  info: "#60A5FA", // blue-400

  successLight: "#064E3B",
  warningLight: "#431407",
  dangerLight: "#450A0A",
  infoLight: "#1E3A5F",

  ring: "#3B82F6",
  input: "#334155",

  gradient: {
    primary: ["#3B82F6", "#1D4ED8"],
    accent: ["#FB923C", "#EA580C"],
  },

  shadow: {
    sm: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 15,
      elevation: 8,
    },
  },
};
