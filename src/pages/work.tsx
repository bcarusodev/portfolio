import React from "react";
import {
  Box,
  Button,
  Card,
  Text,
  CardHeader,
  Container,
  Heading,
  Image,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { AboutMe } from "../components/Organisms/AboutMe";
import Hero from "../components/Organisms/Hero";
import { Services } from "../components/Organisms/Services";
import { useRouter } from "next/router";
import Layout from "../components/Atoms/Layout";
import { ProjectCard } from "../components/Molecules/ProjectCard";
import { PROJECTS } from "../../data/Work";
import { Project } from "../types/data";

const Work = () => {
  const router = useRouter();
  return (
    <Layout>
      <Flex display="column" alignItems={"center"}>
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
          p={20}
          alignItems="center"
        >
          {Object.keys(PROJECTS).map((key) => (
            <ProjectCard
              key={PROJECTS[key].name}
              id={key}
              title={PROJECTS[key].name}
              topic={PROJECTS[key].topic}
              imgSrc={PROJECTS[key].imgSrc}
            />
          ))}
        </Flex>
      </Flex>
    </Layout>
  );
};

export default Work;
