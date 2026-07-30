import {
  Bell,
  LayoutDashboard,
  Map,
  Notebook,
  Receipt,
  ShoppingBasket,
  Sprout,
  Tractor,
  type LucideIcon,
} from "lucide-react";

export type EntityKey =
  | "farms"
  | "parcels"
  | "seasons"
  | "activities"
  | "expenses"
  | "harvests"
  | "reminders"
  | "dashboard";

export type EntityColor = {
  tint: string;
  border: string;
  solid: string;
  textStrong: string;
  textSoft: string;
  badgeBg: string;
};

export type EntityTheme = {
  label: string;
  icon: LucideIcon;
  color: EntityColor;
};

export const entityTheme: Record<EntityKey, EntityTheme> = {
  farms: {
    label: "Fermat",
    icon: Tractor,
    color: {
      tint: "#EAF3DE",
      border: "#639922",
      solid: "#3B6D11",
      textStrong: "#173404",
      textSoft: "#3B6D11",
      badgeBg: "#C0DD97",
    },
  },
  parcels: {
    label: "Parcelat",
    icon: Map,
    color: {
      tint: "#E1F5EE",
      border: "#1D9E75",
      solid: "#0F6E56",
      textStrong: "#04342C",
      textSoft: "#0F6E56",
      badgeBg: "#9FE1CB",
    },
  },
  seasons: {
    label: "Sezonet",
    icon: Sprout,
    color: {
      tint: "#FAEEDA",
      border: "#EF9F27",
      solid: "#854F0B",
      textStrong: "#412402",
      textSoft: "#854F0B",
      badgeBg: "#FAC775",
    },
  },
  activities: {
    label: "Ditari",
    icon: Notebook,
    color: {
      tint: "#EEEDFE",
      border: "#7F77DD",
      solid: "#3C3489",
      textStrong: "#26215C",
      textSoft: "#3C3489",
      badgeBg: "#CECBF6",
    },
  },
  expenses: {
    label: "Shpenzime",
    icon: Receipt,
    color: {
      tint: "#FAECE7",
      border: "#D85A30",
      solid: "#993C1D",
      textStrong: "#4A1B0C",
      textSoft: "#993C1D",
      badgeBg: "#F5C4B3",
    },
  },
  harvests: {
    label: "Korrje",
    icon: ShoppingBasket,
    color: {
      tint: "#E6F1FB",
      border: "#378ADD",
      solid: "#185FA5",
      textStrong: "#042C53",
      textSoft: "#185FA5",
      badgeBg: "#B5D4F4",
    },
  },
  reminders: {
    label: "Kujtesa",
    icon: Bell,
    color: {
      tint: "#FBEAF0",
      border: "#D4537E",
      solid: "#72243E",
      textStrong: "#4B1528",
      textSoft: "#72243E",
      badgeBg: "#F4C0D1",
    },
  },
  dashboard: {
    label: "Ballina",
    icon: LayoutDashboard,
    color: {
      tint: "#F1F2F4",
      border: "#9AA1AC",
      solid: "#4B5563",
      textStrong: "#1F2937",
      textSoft: "#4B5563",
      badgeBg: "#E2E4E8",
    },
  },
};

export function getEntityTheme(key: EntityKey): EntityTheme {
  return entityTheme[key];
}