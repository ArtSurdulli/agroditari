import { BarChart3, LayoutDashboard, type LucideIcon } from "lucide-react";
import { entityTheme, type EntityColor } from "@/lib/entity-theme";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  color: EntityColor;
  // Included in the mobile bottom navigation (max 5 items).
  mobile?: boolean;
};

export const navItems: NavItem[] = [
  {
    href: "/",
    label: "Ballina",
    icon: LayoutDashboard,
    color: entityTheme.dashboard.color,
    mobile: true,
  },
  {
    href: "/farms",
    label: "Fermat",
    icon: entityTheme.farms.icon,
    color: entityTheme.farms.color,
    mobile: true,
  },
  {
    href: "/parcels",
    label: "Parcelat",
    icon: entityTheme.parcels.icon,
    color: entityTheme.parcels.color,
  },
  {
    // Points at /seasons for now — the activity diary itself will live
    // inside a season later, but this is where "Ditari" lands until then.
    href: "/seasons",
    label: "Ditari",
    icon: entityTheme.activities.icon,
    color: entityTheme.activities.color,
    mobile: true,
  },
  {
    href: "/expenses",
    label: "Shpenzime",
    icon: entityTheme.expenses.icon,
    color: entityTheme.expenses.color,
  },
  {
    href: "/harvests",
    label: "Korrje",
    icon: entityTheme.harvests.icon,
    color: entityTheme.harvests.color,
  },
  {
    href: "/reports",
    label: "Raporte",
    icon: BarChart3,
    color: entityTheme.dashboard.color,
    mobile: true,
  },
  {
    href: "/reminders",
    label: "Kujtesa",
    icon: entityTheme.reminders.icon,
    color: entityTheme.reminders.color,
    mobile: true,
  },
];