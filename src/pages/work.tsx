import React from "react";
import Layout from "../components/Atoms/Layout";
import { ProjectCard } from "@/components/Molecules/ProjectCard";
import { projects } from "@velite";
import { BlurFade } from "@/components/ui/blur-fade";
import Title from "@/components/Atoms/Title/title";
import constants from "@/constants";

const Work = () => {
  return (
    <Layout>
      <div className="w-full flex justify-center">
        <div className="max-w-[1200px] flex flex-col items-center pt-16 md:pt-5">
          <div className="text-center tracking-tight">
            <BlurFade inView>
              <Title>Work</Title>
            </BlurFade>
            <BlurFade>
              <p>Projects in which i was involved</p>
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
