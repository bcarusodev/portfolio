import { IoMdBriefcase } from "react-icons/io";
import { TimelineItem } from "../src/types/data";

export const EXPERIENCE_ITEMS: Array<TimelineItem> = [
  {
    icon: IoMdBriefcase,
    fromDate: new Date("2022-02-02"),
    toDate: "Present",
    title: "Software Developer",
    subtitle: "Chubut IT",
  },
  {
    icon: IoMdBriefcase,
    fromDate: new Date("2021-04-02"),
    toDate: new Date("2022-02-02"),
    title: "Full Stack Developer",
    subtitle: "StoryDots ~ IT Crowd",
  },
  {
    icon: IoMdBriefcase,
    fromDate: new Date("2020-12-02"),
    toDate: new Date("2021-07-02"),
    title: "Frontend Developer",
    subtitle: "MerlionTechs",
  },
];
