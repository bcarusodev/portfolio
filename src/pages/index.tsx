import React from "react";
import { Container, VStack } from "@chakra-ui/react";
import { AboutMe } from "../components/Organisms/AboutMe";
import Hero from "../components/Organisms/Hero";
import { Services } from "../components/Organisms/Services";

const Index = () => (
  <>
    <Container maxW={"7xl"}>
      <Hero />
      <VStack spacing={10}>
        <Services />
        <AboutMe />
      </VStack>
    </Container>
  </>
);

export default Index;
