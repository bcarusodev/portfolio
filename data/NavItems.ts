import { NavItem } from "../src/types/data";

export const NAV_ITEMS: Array<NavItem> = [
  {
    label: "Home",
    href: "/",
    enabled: true,
  },
  {
    label: "Work",
    // children: [
    //   {
    //     label: "Work",
    //     subLabel: "Work done on my daily work",
    //     href: "#",
    //     enabled: true,
    //   },
    //   {
    //     label: "Personal",
    //     subLabel: "Own personal work",
    //     href: "#",
    //     enabled: true,
    //   },
    // ],
    href: "/work",
    enabled: true,
  },
  {
    label: "About Me",
    href: "/about",
    enabled: true,
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
