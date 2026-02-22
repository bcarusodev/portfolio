import React from "react";
import constants from "../../../constants";
import { BlurFade } from "@/components/ui/blur-fade";
import { ContactButtons } from "@/components/Molecules/ContactButtons";
import { LineShadowText } from "@/components/ui/line-shadow-text";
import { useTheme } from "next-themes";
import { FaReact } from "react-icons/fa";
import { TbBrandNextjs } from "react-icons/tb";
import { SiExpress, SiTailwindcss } from "react-icons/si";

export default function Hero() {
  const theme = useTheme();
  const shadowColor = theme.resolvedTheme === "dark" ? "white" : "black";

  return (
    <div className="flex justify-center self-center items-center h-[90vh]">
      <div className="flex flex-col md:flex-row items-center py-10 md:py-0">
        <div className="flex-1 flex flex-col gap-5 md:gap-10">
          <h1 className="text-center leading-tight font-bold tracking-tighter text-4xl sm:text-5xl lg:text-6xl">
            <BlurFade delay={constants.BLUR_FADE_DELAY * 2}>
              brunocaruso
            </BlurFade>
            <BlurFade delay={constants.BLUR_FADE_DELAY * 4}>
              <span className="pointer-events-none z-10 whitespace-pre-wrap bg-gradient-to-b from-[#ffd319] via-[#ff2975] to-[#8c1eff] bg-clip-text text-center text-4xl md:text-5xl lg:text-6xl font-bold leading-none tracking-tighter text-transparent">
                passionate
              </span>
            </BlurFade>
            <BlurFade delay={constants.BLUR_FADE_DELAY * 5}>
              software{" "}
              <LineShadowText className="italic" shadowColor={shadowColor}>
                developer
              </LineShadowText>
            </BlurFade>
          </h1>

          <BlurFade delay={constants.BLUR_FADE_DELAY * 5}>
            <p className="max-w-xl text-balance text-center text-base tracking-tighter text-black dark:font-normal dark:text-white md:text-lg">
              Welcome to my portfolio! My name is Bruno, self-taught by nature
              and constantly learning about development & technology. My main
              stack is on <b>TypeScript</b> and <b>Node</b>. 💡😙
            </p>
          </BlurFade>
          <BlurFade delay={constants.BLUR_FADE_DELAY * 5}>
            <div className="flex justify-center gap-2">
              <FaReact className="w-[38px] h-[38px]" />
              <TbBrandNextjs className="w-[38px] h-[38px]" />
              <SiTailwindcss className="w-[38px] h-[38px]" />
              <SiExpress className="w-[38px] h-[38px]" />
            </div>
          </BlurFade>

          <BlurFade delay={constants.BLUR_FADE_DELAY * 6}>
            <ContactButtons />
          </BlurFade>
        </div>
      </div>
    </div>
  );
}
