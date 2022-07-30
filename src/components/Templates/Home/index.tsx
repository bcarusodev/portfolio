import { Container } from "@chakra-ui/react";
import Hero from "../../Organisms/Hero";
import { Services } from "../../../pages/services";
import React from "react";

// TODO: make dark mode automatically with mobile device modes

export const Home = () => (
  <Container maxW={"7xl"}>
    <Hero />
    <Services />
  </Container>
);
