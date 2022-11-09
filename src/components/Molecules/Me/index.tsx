import { Box, Flex, Heading, Image, Link, Stack, Text } from "@chakra-ui/react";

export const Me = () => {
  return (
    <Stack
      align={"center"}
      spacing={{ base: 8, md: 5 }}
      direction={{ base: "column-reverse", md: "row" }}
    >
      <Stack spacing={8}>
        <Box>
          <Heading fontSize={"3xl"} fontWeight={800} fontFamily={"body"}>
            Bruno Fabrizio Caruso
          </Heading>
          <Text as={"span"}>
            Full Stack Developer @{" "}
            <Link href={"https://www.modo.com.ar"}>MODO</Link>
          </Text>
        </Box>
        <Flex maxW={"40rem"}>
          <Text color={"gray.500"}>
            +2 years working with JavaScript & top-tier technologies like React,
            NodeJS, REST. Passionate Developer & technology enthusiast.
            User-centered mentality building high-quality-grade solutions. I
            also like finances, fitness, hackintoshing and entrepreneurial
            spirit. Self-taught by nature and constantly learning.
          </Text>
        </Flex>
      </Stack>

      <Image
        loading={"eager"}
        fit={"cover"}
        borderRadius={"full"}
        align={"center"}
        boxShadow={"2xl"}
        css={{ objectViewBox: "inset(0% -16% 21% 0%)" }}
        boxSize={"250px"}
        src={"/assets/images/hero.jpg"}
      />
    </Stack>
  );
};
