import React from "react";
import Head from "next/head";
import Layout from "../components/Atoms/Layout";
import { ProjectCard } from "@/components/Molecules/ProjectCard";
import { projects } from "@velite";
import { BlurFade } from "@/components/ui/blur-fade";
import Title from "@/components/Atoms/Title/title";
import constants from "@/constants";

const Work = () => {
  return (
    <Layout>
      <Head>
        <title>Work — Bruno Caruso</title>
        <meta
          name="description"
          content="Projects in which Bruno Caruso was involved."
        />
        <meta property="og:title" content="Work — Bruno Caruso" />
        <meta
          property="og:description"
          content="Projects in which Bruno Caruso was involved."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bcaruso.dev/work" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <div className="w-full flex justify-center">
        <div className="max-w-[1200px] flex flex-col items-center pt-16 md:pt-5">
          <div className="text-center tracking-tight">
            <BlurFade inView>
              <Title>Work</Title>
            </BlurFade>
            <BlurFade>
              <p>Projects in which I was involved</p>
            </BlurFade>
          </div>

          <div className="flex gap-8 justify-center flex-wrap min-h-[70vh] py-10 pb-20 px-4 items-center">
            {projects.map((project, index) => (
              <BlurFade
                key={project.id}
                inView
                delay={constants.BLUR_FADE_DELAY + index * 0.05}
              >
                <ProjectCard
                  id={project.id}
                  title={project.title}
                  topic={project.topic}
                  imgSrc={project.thumbnail}
                  blurhash={project.blurhash}
                />
              </BlurFade>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Work;
