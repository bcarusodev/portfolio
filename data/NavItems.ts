import { NavItem } from "../src/types/data";

export const NAV_ITEMS: Array<NavItem> = [
  {
    label: "Home",
    href: "#",
  },
  {
    label: "Projects",
    children: [
      {
        label: "Work",
        subLabel: "Projects done on my daily work",
        href: "#",
      },
      {
        label: "Personal",
        subLabel: "Own personal projects",
        href: "#",
      },
    ],
  },
  {
    label: "About Me",
    href: "#",
  },
];
