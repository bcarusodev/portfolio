import { IconType } from "react-icons";

interface NavItem {
  label: string;
  subLabel?: string;
  children?: Array<NavItem>;
  href?: string;
}

interface SkillItem {
  title: string;
  icon: IconType;
  description: string;
}
