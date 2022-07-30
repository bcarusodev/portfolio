import NavBar from "../components/NavBar/NavBar";
import Hero from "../components/Hero";
import React from "react";
import Footer from "../components/Footer";
import { Services } from "./services";
import { Container } from "@chakra-ui/react";

// TODO: make dark mode automatically with mobile device modes

const Index = () => (
  <>
    <NavBar />
    <Container maxW={"7xl"}>
      <Hero />
      <Services />
    </Container>
    <Footer />
  </>
);

export default Index;
