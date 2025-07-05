import { TimelineItem } from "@/types/data";
import ChubutItLogo from "../public/assets/images/experiences/chubutit_logo.webp";
import RemiteeLogo from "../public/assets/images/experiences/remitee_logo.jpeg";
import MTLogo from "../public/assets/images/experiences/merlion_techs_logo.jpeg";
import ITCLogo from "../public/assets/images/experiences/it_crowd_argentina_logo.jpeg";

export const EXPERIENCE_ITEMS: Array<TimelineItem> = [
  {
    iconSrc: RemiteeLogo,
    fromDate: new Date("2025-03-02"),
    toDate: "Present",
    title: "Treasury Software Developer",
    subtitle: "Remitee",
    url: "https://www.remitee.com",
  },
  {
    iconSrc: ChubutItLogo,
    fromDate: new Date("2022-02-02"),
    toDate: new Date("2025-03-02"),
    title: "Software Developer",
    subtitle: "Chubut IT",
    url: "https://www.chubut.it",
  },
  {
    iconSrc: ITCLogo,
    fromDate: new Date("2021-04-02"),
    toDate: new Date("2022-02-02"),
    title: "Full Stack Developer",
    subtitle: "StoryDots ~ IT Crowd",
    url: "https://www.itcrowd.dev",
  },
  {
    iconSrc: MTLogo,
    fromDate: new Date("2020-09-02"),
    toDate: new Date("2021-04-02"),
    title: "Frontend Developer",
    subtitle: "MerlionTechs",
    url: "https://www.linkedin.com/company/merlion-techs",
  },
];
