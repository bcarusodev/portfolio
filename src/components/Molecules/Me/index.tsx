import { Box, Flex, Heading, Image, Stack } from "@chakra-ui/react";

export const Me = () => {
  return (
    <Stack
      align={"center"}
      spacing={{ base: 8, md: 5 }}
      direction={{ base: "column-reverse", md: "row" }}
    >
      <Stack spacing={8}>
        <Box>
          <Heading fontSize={"3xl"} fontWeight={700} fontFamily={"body"}>
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
        loading={"eager"}
        fit={"cover"}
        borderRadius={"full"}
        align={"center"}
        boxShadow={"2xl"}
        css={{ objectViewBox: "inset(0% -16% 21% 0%)" }}
        boxSize={"150px"}
        src={"/assets/images/hero.jpg"}
      />
    </Stack>
  );
};
