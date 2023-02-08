import React from "react";
import { Button, Container, VStack } from "@chakra-ui/react";
import { AboutMe } from "../components/Organisms/AboutMe";
import Hero from "../components/Organisms/Hero";
import { Services } from "../components/Organisms/Services";
import { useRouter } from "next/router";
import Layout from "../components/Atoms/Layout";

const Index = () => {
  const router = useRouter();
  return (
    <Layout>
      <Container maxW={"7xl"}>
        <Hero />
        <VStack spacing={10} pb={28}>
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
    </Layout>
  );
};

export default Index;
