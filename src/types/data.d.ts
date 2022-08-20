import { IconType } from "react-icons";

export interface NavItem {
  label: string;
  subLabel?: string;
  enabled?: boolean;
  children?: Array<NavItem>;
  href?: string;
}

export interface SkillItem {
  title: string;
  icon: IconType;
  description: string;
}
