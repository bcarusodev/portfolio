import { TbWorld } from "react-icons/tb";
import { BiCodeAlt, BiTestTube } from "react-icons/bi";
import { FaServer } from "react-icons/fa";
import { SkillItem } from "../src/types/global";
import { CgArrowsMergeAltH } from "react-icons/cg";

export const SKILLS_ITEMS: Array<SkillItem> = [
  {
    icon: TbWorld,
    title: "Web Apps",
    description:
      "Custom, quality-made, flexible and reliable web development for your projects needs.",
  },
  {
    icon: BiCodeAlt,
    title: "Backend Development",
    description:
      "Development & problem-solving for all the magic that happens behind-the-scenes.",
  },
  {
    icon: FaServer,
    title: "DevOps",
    description:
      "I can help cover architecture solutions, continuous integration, delivery and deployment.",
  },
  {
    icon: CgArrowsMergeAltH,
    title: "Custom Integrations",
    description:
      "Integrations with CRMs, auth services, payment gateways or custom APIs.",
  },
  {
    icon: BiTestTube,
    title: "Unit Testing",
    description: "Tests to ensure a reliable and robust solutions.",
  },
];
