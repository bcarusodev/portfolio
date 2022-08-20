import { NavItem } from "../src/types/data";

export const NAV_ITEMS: Array<NavItem> = [
  {
    label: "Home",
    href: "#",
    enabled: true,
  },
  {
    label: "Projects",
    children: [
      {
        label: "Work",
        subLabel: "Projects done on my daily work",
        href: "#",
        enabled: true,
      },
      {
        label: "Personal",
        subLabel: "Own personal projects",
        href: "#",
        enabled: true,
      },
    ],
    enabled: false,
  },
  {
    label: "About",
    href: "#",
    enabled: false,
  },
  {
    label: "Dashboard",
    href: "#",
    enabled: false,
  },
  {
    label: "Tools",
    href: "#",
    enabled: false,
  },
];
