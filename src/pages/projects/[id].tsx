import { ProjectDetailProps } from "@data/projects/types";
import {
  Container,
  Heading,
  VStack,
  Text,
  HStack,
  Box,
  Link,
  Badge,
} from "@chakra-ui/react";
import Layout from "src/components/Atoms/Layout";
import { useRouter } from "next/router";
import { ArrowBackIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { stacksMap } from "@data/projects/loader";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const Project = ({ projectData }: ProjectDetailProps) => {
  const router = useRouter();
  return (
    <Layout>
      <Container maxW={"1200px"}>
        <VStack spacing={10} pt={10} pb={28} textAlign="center">
          <Button
            variant={"outline"}
            className={"text-xs h-7 px-2"}
            onClick={() => router.back()}
          >
            <ArrowBackIcon /> All Projects
          </Button>
          <Heading>{projectData.title}</Heading>
          <Text color="gray.500">{projectData.description}</Text>
          {projectData.detailImage && (
            <Image
              width={1100}
              height={720}
              objectFit="cover"
              src={projectData.detailImage}
              alt={projectData.title}
            ></Image>
          )}
          {/* <Heading size="md">responsabilities</Heading>
          <Text color="gray.500">{projectData.responsabilities}</Text> */}
          <Heading size="md">technologies used</Heading>
          <HStack spacing={5}>
            {projectData.stacks.map((stackId) => {
              const stack = stacksMap[stackId];
              return (
                <VStack key={stackId}>
                  <Badge
                    px={2}
                    py={1}
                    variant="subtle"
                    colorScheme={stack?.colorScheme ?? "gray"}
                  >
                    <HStack>
                      <stack.icon size={"35px"} />
                    </HStack>
                  </Badge>
                  <Text color="gray.500" fontSize="xs">
                    {stack.name}
                  </Text>
                </VStack>
              );
            })}
          </HStack>
          <HStack spacing={10}>
            <Box>
              <Heading size="sm" textTransform={"uppercase"} pb={2}>
                Role
              </Heading>
              <Text color="gray.500">{projectData.role}</Text>
            </Box>
            <Box>
              <Heading size="sm" textTransform={"uppercase"} pb={2}>
                Client
              </Heading>
              <Text color="gray.500">{projectData.client}</Text>
            </Box>
            {projectData.projectLink && (
              <Box>
                <Heading size="sm" textTransform={"uppercase"} pb={2}>
                  URL
                </Heading>
                <Link
                  color="gray.500"
                  href={projectData.projectLink}
                  isExternal
                >
                  {projectData.projectLink.replace(/^https?:\/\//i, "")}
                  <ExternalLinkIcon mx="4px" mt="-4px" />
                </Link>
              </Box>
            )}
          </HStack>
        </VStack>
      </Container>
    </Layout>
  );
};

export { getStaticPaths, getStaticProps } from "../../../data/projects/loader";
export default Project;
