import { Box, Flex, Heading, Stack } from "@chakra-ui/react";
import Image from "next/image";

export const Me = () => {
  return (
    <Stack
      align={"center"}
      spacing={{ base: 8, md: 5 }}
      direction={{ base: "column-reverse", md: "row" }}
    >
      <Stack spacing={8}>
        <Box>
          {/* @ts-expect-error - Chakra UI Heading produces complex union types */}
          <Heading fontSize="3xl" fontWeight={700}>
            Hi, I{"'"}m Bruno 👋
          </Heading>
          <span className={"inline-block max-w-[600px] md:text-xl"}>
            Full Stack Engineer
          </span>
        </Box>
        <Flex maxW={"full"}>
          <p
            className={
              "prose text-pretty font-sans text-sm text-muted-foreground dark:prose-invert"
            }
          >
            I started development in 2017 when I created{" "}
            <a
              href={
                "https://web.archive.org/web/20170109042450/http://www.mtalpm.com/"
              }
              className={"underline"}
            >
              my first game server using Lua scripting
            </a>
            . In 2019, driven by curiosity, I began learning on my own through
            Udemy and YouTube. Then, in 2020, I started my professional career.
            Now, with four years of experience in various projects (fintech,
            ad-tech, ERP, B2B, B2C), I love working with React, Next.js, and
            Node.js. I{"'"}m open to other frameworks and languages and have a
            strong interest in crypto- and fintech-related industries.
          </p>
        </Flex>
      </Stack>

      <Image
        width={150}
        height={150}
        className={"object-cover rounded-full shadow-2xl aspect-square"}
        loading={"eager"}
        // @ts-ignore
        style={{ objectViewBox: "inset(0% -16% 21% 0%)" }}
        src={"/assets/images/hero.jpg"}
        alt={"Me"}
      />
    </Stack>
  );
};
