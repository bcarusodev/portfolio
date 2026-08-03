import React from "react";
import { AboutMe } from "../components/Organisms/AboutMe";
import Hero from "../components/Organisms/Hero";
import { Services } from "../components/Organisms/Services";
import Head from "next/head";
import Link from "next/link";
import Layout from "../components/Atoms/Layout";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";
import constants from "@/constants";

const Index = () => {
  return (
    <Layout>
      <Head>
        <title>Bruno Caruso — Software Developer</title>
        <meta
          name="description"
          content="Bruno Caruso — software developer building modern, performant web experiences."
        />
        <meta property="og:title" content="Bruno Caruso — Software Developer" />
        <meta
          property="og:description"
          content="Software developer and portfolio."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bcaruso.dev" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <div className="max-w-7xl mx-auto px-4 z-[2]">
        <Hero />
        <div className="flex flex-col gap-20 pb-20 items-center">
          <Services />
          <BlurFade delay={constants.BLUR_FADE_DELAY} inView>
            <AboutMe />
          </BlurFade>
          <BlurFade delay={constants.BLUR_FADE_DELAY} inView>
            <Link href="/about">
              <Button className="w-50" variant="outline">
                See more
              </Button>
            </Link>
          </BlurFade>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
