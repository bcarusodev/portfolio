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
        label: "As employee",
        subLabel: "Projects done on my daily work",
        href: "#",
      },
      {
        label: "Freelance",
        subLabel: "Contract work projects",
        href: "#",
      },
    ],
  },
  {
    label: "About Me",
    href: "#",
  },
];
