import React from "react";
import { Box, Flex } from "@chakra-ui/react";
import Layout from "../components/Atoms/Layout";
import { ProjectCard } from "@/components/Molecules/ProjectCard";
import { allProjects } from "contentlayer/generated";
import { BlurFade } from "@/components/ui/blur-fade";
import Title from "@/components/Atoms/Title/title";
import constants from "@/constants";

const Work = () => {
  return (
    <Layout>
      <Box width={"100%"} display={"flex"} justifyContent={"center"}>
        <Flex
          maxWidth={"1200px"}
          display="column"
          alignItems={"center"}
          className={"pt-16 md:pt-5"}
        >
          <Box textAlign={"center"}>
            <BlurFade inView>
              <Title>Work</Title>
            </BlurFade>
            <BlurFade>
              <p>Projects in which i was involved</p>
            </BlurFade>
          </Box>

          <Flex
            gap={8}
            justifyContent={"center"}
            flexWrap={"wrap"}
            minHeight="70vh"
            py={10}
            pb={20}
            px={4}
            alignItems="center"
          >
            {allProjects.map((project, index) => (
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
          </Flex>
        </Flex>
      </Box>
    </Layout>
  );
};

export default Work;
