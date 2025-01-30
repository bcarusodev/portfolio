import React from "react";
import { Container, VStack } from "@chakra-ui/react";
import { AboutMe } from "../components/Organisms/AboutMe";
import Hero from "../components/Organisms/Hero";
import { Services } from "../components/Organisms/Services";
import { useRouter } from "next/router";
import Layout from "../components/Atoms/Layout";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";
import constants from "@/constants";

const Index = () => {
  const router = useRouter();
  return (
    <Layout>
      <Container maxW={"7xl"} zIndex={2}>
        <Hero />
        <VStack spacing={20} pb={20}>
          <Services />
          <BlurFade delay={constants.BLUR_FADE_DELAY} inView>
            <AboutMe />
          </BlurFade>
          <BlurFade delay={constants.BLUR_FADE_DELAY} inView>
            <Button
              className={"w-full"}
              variant={"outline"}
              onClick={() => router.push("/about")}
            >
              See more
            </Button>
          </BlurFade>
        </VStack>
      </Container>
    </Layout>
  );
};

export default Index;
