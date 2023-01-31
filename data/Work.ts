import { Project } from "../src/types/data";
import { TECHNOLOGIES as Tech } from "./Technologies";

export const PROJECTS: Record<string, Project> = {
  ally: {
    name: "ALLY",
    topic: "Clean Energy",
    description:
      "Online job board with thousands of clean energy industry jobs",
    techsUsed: [Tech.TS, Tech.NODE],
    workedOn: "ITCrowd",
    imgSrc: "assets/images/projects/ally/cover.jpg",
  },
  modo: {
    name: "MODO",
    topic: "Fintech",
    description: "Argentina's recognized wallet for digital banking",
    techsUsed: [Tech.TS, Tech.NODE],
    workedOn: "Chubut IT",
    imgSrc: "assets/images/projects/modo/cover.jpeg",
  },
  nbs: {
    name: "Nature Based Solutions",
    topic: "Intelligence",
    description:
      "An intelligence platform that helps large scale investors accelerate capital allocation to climate solutions",
    techsUsed: [Tech.TS, Tech.NODE],
    workedOn: "ITCrowd",
    imgSrc: "assets/images/projects/nbs/cover.jpg",
  },
  sd: {
    name: "StoryDots",
    topic: "Marketing",
    description:
      "App for e-commerce to enable gifting in shopping carts. An experience providing clients with the possibillity to send virtual video greeting cards with their gifts, atttached to a physical QR Tag the receiving party can scan to see the video and engage in the experience",
    techsUsed: [Tech.TS, Tech.NODE],
    workedOn: "ITCrowd",
    imgSrc: "assets/images/projects/sd/cover.png",
  },
};
