import React from "react";
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
      <div className="max-w-7xl mx-auto px-4 z-[2]">
        <Hero />
        <div className="flex flex-col gap-20 pb-20 items-center">
          <Services />
          <BlurFade delay={constants.BLUR_FADE_DELAY} inView>
            <AboutMe />
          </BlurFade>
          <BlurFade delay={constants.BLUR_FADE_DELAY} inView>
            <Button
              className="w-50"
              variant="outline"
              onClick={() => router.push("/about")}
            >
              See more
            </Button>
          </BlurFade>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
