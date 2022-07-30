import {
  Container,
  Stack,
  Flex,
  Box,
  Heading,
  Text,
  Button,
  Image,
  useColorModeValue,
  SlideFade,
} from "@chakra-ui/react";
import React from "react";
import TextTransition, { presets } from "react-text-transition";
import { HERO_TEXTS } from "../../../../data/Hero";
import Link from "next/link";

export default function Hero() {
  const [index, setIndex] = React.useState(0);

  // TODO: add transition to brunocaruso -> bcaruso.dev

  React.useEffect(() => {
    const intervalId = setInterval(
      () =>
        setIndex((index) => (index === HERO_TEXTS.length - 1 ? 0 : index + 1)),
      4500
    );
    return () => clearTimeout(intervalId);
  }, []);

  return (
    <Container maxW={"7xl"}>
      <Stack
        align={"center"}
        spacing={{ base: 8, md: 10 }}
        py={{ base: 10, md: 28 }}
        direction={{ base: "column", md: "row" }}
      >
        <Stack flex={1} spacing={{ base: 5, md: 10 }}>
          <SlideFade
            in={true}
            offsetY="30px"
            transition={{ enter: { duration: 0.7 } }}
          >
            <Heading
              lineHeight={1.1}
              fontWeight={600}
              fontSize={{ base: "4xl", sm: "5xl", lg: "6xl" }}
            >
              <Text as={"span"} fontWeight={700}>
                brunocaruso
              </Text>
              <br />
              <Text
                as={"span"}
                position={"relative"}
                bgGradient="linear(to-l, heroGradientStart, heroGradientEnd)"
                bgClip="text"
              >
                passionate
              </Text>
              <br />
              <Text as={"span"}>
                <TextTransition springConfig={presets.default} inline>
                  {HERO_TEXTS[index]}
                </TextTransition>
              </Text>
            </Heading>
          </SlideFade>

          <SlideFade
            in={true}
            offsetY="30px"
            transition={{ enter: { duration: 0.9 } }}
          >
            <Text
              fontSize={"xl"}
              color={useColorModeValue("gray.500", "white")}
            >
              Welcome to my portfolio! My name is Bruno, self-taught by nature
              and constantly learning about development & technology. 💡😙
            </Text>
          </SlideFade>

          <SlideFade
            in={true}
            offsetY="30px"
            transition={{ enter: { duration: 1.1 } }}
          >
            <Stack direction={{ base: "column", sm: "row" }}>
              <Link href={"mailto:brunofcaruso@gmail.com"}>
                <Button size={"lg"} fontWeight={"normal"} px={6}>
                  Get in touch
                </Button>
              </Link>
            </Stack>
          </SlideFade>
        </Stack>
        <Flex
          flex={1}
          justify={"center"}
          align={"center"}
          position={"relative"}
          w={"full"}
        >
          <SlideFade
            in={true}
            offsetY="30px"
            transition={{ enter: { duration: 1.3 } }}
          >
            <Box
              position={"relative"}
              height={"400px"}
              rounded={"2xl"}
              boxShadow={"2xl"}
              width={"full"}
              overflow={"hidden"}
            >
              <Image
                loading={"eager"}
                fit={"cover"}
                align={"center"}
                w={"100%"}
                h={"100%"}
                src={"/assets/images/hero.png"}
              />
            </Box>
          </SlideFade>
        </Flex>
      </Stack>
    </Container>
  );
}
