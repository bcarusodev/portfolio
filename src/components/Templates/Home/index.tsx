import React from "react";
import { Container, VStack } from "@chakra-ui/react";
import Hero from "../../Organisms/Hero";
import { Services } from "../../Organisms/Services";
import { AboutMe } from "../../Organisms/AboutMe";

// TODO: make dark mode automatically with mobile device modes

export const Home = () => (
  <Container maxW={"7xl"}>
    <Hero />
    <VStack spacing={10}>
      <Services />
      <AboutMe />
    </VStack>
  </Container>
);
