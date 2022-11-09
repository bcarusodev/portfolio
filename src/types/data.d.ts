import { IconType } from "react-icons";
import { ThemeTypings } from "@chakra-ui/styled-system";

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
export interface TimelineItem {
  icon: ReactNode;
  fromDate: Date;
  toDate?: Date | "Present";
  title: string;
  subtitle: string;
  description?: string;
}

export interface Technology {
  name: string;
  colorScheme?: ThemeTypings["colorSchemes"];
}
