import React from "react";
import { Box, Text, Heading, Flex } from "@chakra-ui/react";
import Layout from "../components/Atoms/Layout";
import { ProjectCard } from "../components/Molecules/ProjectCard";
import { allProjects } from "contentlayer/generated";

const Work = () => {
  return (
    <Layout>
      <Box width={"100%"} display={"flex"} justifyContent={"center"}>
        <Flex maxWidth={"1200px"} display="column" alignItems={"center"}>
          <Box textAlign={"center"}>
            <Heading
              fontWeight={600}
              fontSize={"4xl"}
              letterSpacing={"-1px"}
              pb={2}
            >
              work
            </Heading>
            <Text color="gray.500">projects in which i was involved</Text>
          </Box>

          <Flex
            gap={10}
            justifyContent={"center"}
            flexWrap={"wrap"}
            minHeight="70vh"
            py={20}
            px={4}
            alignItems="center"
          >
            {allProjects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.title}
                topic={project.topic}
                imgSrc={project.thumbnail}
              />
            ))}
          </Flex>
        </Flex>
      </Box>
    </Layout>
  );
};

export default Work;
