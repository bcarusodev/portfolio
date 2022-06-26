import { Flex, Text, Heading } from "@chakra-ui/react";
import { Container } from "./Container";

export const Hero = ({ title }: { title: string }) => (
  <Container justifyContent="center" alignItems="center" height="50vh">
    <Flex
      bgGradient="linear(to-l, heroGradientStart, heroGradientEnd)"
      bgClip="text"
    >
      <Heading fontSize="6vw">Welcome!</Heading>
    </Flex>
    <Text textAlign={"center"}>
      Hello, i am Bruno, a passionate Full Stack Developer & technology
      enthusiast. I have a high proficiency in JavaScript and a user-centered
      mentality for building products. I also like finances, fitness,
      hackintoshing and entrepreneurial spirit. Self-taught by nature and
      constantly learning.
    </Text>
  </Container>
);
