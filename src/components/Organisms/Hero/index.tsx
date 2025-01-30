import { Container, Stack, Heading } from "@chakra-ui/react";
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
    <Container
      // maxW={"7xl"}
      display={{ base: "unset", md: "flex" }}
      height={"90vh"}
      className={"justify-center self-center items-center flex"}
    >
      <Stack
        align={"center"}
        direction={{ base: "column", md: "row" }}
        className={"py-10 md:py-0"}
      >
        <Stack flex={1} spacing={{ base: 5, md: 10 }}>
          <Heading
            lineHeight={1.1}
            fontWeight={700}
            letterSpacing={"-2px"}
            className={"text-center"}
            fontSize={{ base: "4xl", sm: "5xl", lg: "6xl" }}
          >
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
          </Heading>

          <BlurFade delay={constants.BLUR_FADE_DELAY * 5}>
            <p
              className={
                "max-w-xl text-balance text-center text-base tracking-tight text-black dark:font-medium dark:text-white md:text-lg "
              }
            >
              Welcome to my portfolio! My name is Bruno, self-taught by nature
              and constantly learning about development & technology. My main
              stack is on <b>TypeScript</b> and <b>Node</b>. 💡😙
            </p>
          </BlurFade>
          <BlurFade delay={constants.BLUR_FADE_DELAY * 5}>
            <div className={"flex justify-center gap-2"}>
              <FaReact className={"w-[38px] h-[38px]"} />
              <TbBrandNextjs className={"w-[38px] h-[38px]"} />
              <SiTailwindcss className={"w-[38px] h-[38px]"} />
              <SiExpress className={"w-[38px] h-[38px]"} />
            </div>
          </BlurFade>

          <BlurFade delay={constants.BLUR_FADE_DELAY * 6}>
            <ContactButtons />
          </BlurFade>
        </Stack>
      </Stack>
    </Container>
  );
}
