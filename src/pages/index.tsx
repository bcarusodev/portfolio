import React from "react";
import { AboutMe } from "../components/Organisms/AboutMe";
import Hero from "../components/Organisms/Hero";
import { Services } from "../components/Organisms/Services";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import Layout from "../components/Atoms/Layout";
import Title from "../components/Atoms/Title/title";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";
import constants from "@/constants";

// Client-only chat widget: keeps the bundle chunk out of the initial load
// and avoids SSR/localStorage hydration issues (FR-27, NFR-01).
const ChatWidget = dynamic(() => import("@/components/Molecules/ChatWidget"), {
  ssr: false,
});

const AI_CHAT_ENABLED = process.env.NEXT_PUBLIC_AI_CHAT_ENABLED === "true";

const Index = () => {
  const router = useRouter();
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 z-[2]">
        <Hero />
        <div className="flex flex-col gap-20 pb-20 items-center">
          {AI_CHAT_ENABLED ? (
            <div className="w-full max-w-[860px] mx-auto flex flex-col gap-4">
              <div id={constants.ASSISTANT_HEADING_ID}>
                <BlurFade delay={constants.BLUR_FADE_DELAY * 6} inView>
                  <Title>Explore My Story</Title>
                </BlurFade>
              </div>
              <BlurFade delay={constants.BLUR_FADE_DELAY * 7} inView>
                <ChatWidget />
              </BlurFade>
            </div>
          ) : null}
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
