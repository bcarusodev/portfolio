import { Box, Flex, Heading, Image, Stack, Text } from "@chakra-ui/react";

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
            Bruno Fabrizio Caruso
          </Heading>
          <Text as={"span"}>Full Stack Engineer</Text>
        </Box>
        <Flex maxW={"40rem"}>
          <Text color={"gray.500"}>
            I{"'"}m a self-taught Full Stack Engineer with +3 years of
            experience in various projects (fintech, ad-tech, ERP, B2B, B2C)
            working with React, NextJS, Node, and AWS (also Azure & GCP).
            Interested in crypto/fintech-related industries.
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
