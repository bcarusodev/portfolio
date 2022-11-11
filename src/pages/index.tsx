import React from "react";
import { Button, Container, VStack } from "@chakra-ui/react";
import { AboutMe } from "../components/Organisms/AboutMe";
import Hero from "../components/Organisms/Hero";
import { Services } from "../components/Organisms/Services";
import { useRouter } from "next/router";

const Index = () => {
  const router = useRouter();
  return (
    <>
      <Container maxW={"7xl"}>
        <Hero />
        <VStack spacing={10}>
          <Services />
          <AboutMe />
          <Button
            size={"lg"}
            fontWeight={"normal"}
            onClick={() => router.push("/about")}
          >
            See more
          </Button>
        </VStack>
      </Container>
    </>
  );
};

export default Index;
