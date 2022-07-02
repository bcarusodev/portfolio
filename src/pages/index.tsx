import { Text } from "@chakra-ui/react";

import { Container } from "../components/Container";
import { Footer } from "../components/Footer";
import NavBar from "../components/NavBar/NavBar";
import Hero from "../components/Hero";
import React from "react";

const Index = () => (
  <>
    <NavBar />

    <Hero />

    <Container height="100vh">
      <Footer>
        <Text>Next ❤️ Chakra</Text>
      </Footer>
    </Container>
  </>
);

export default Index;
