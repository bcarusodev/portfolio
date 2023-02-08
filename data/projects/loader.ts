import { allProjects, Project } from "contentlayer/generated";
import { GetStaticProps } from "next";
import { FaAws } from "react-icons/fa";
import {
  SiChakraui,
  SiDatadog,
  SiExpress,
  SiMaterialui,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiReact,
  SiServerless,
  SiStorybook,
} from "react-icons/si";
import { ProjectStackProps } from "./types";

export const stacksMap: Record<string, ProjectStackProps> = {
  materialui: { name: "Material UI", icon: SiMaterialui, colorScheme: "teal" },
  nodejs: { name: "NodeJS", icon: SiNodedotjs, colorScheme: "green" },
  react: { name: "React", icon: SiReact, colorScheme: "cyan" },
  serverless: { name: "Serverless", icon: SiServerless, colorScheme: "red" },
  aws: { name: "AWS", icon: FaAws, colorScheme: "orange" },
  expressjs: { name: "Express", icon: SiExpress, colorScheme: "gray" },
  mysql: { name: "MySQL", icon: SiMysql, colorScheme: "orange" },
  postgres: { name: "PostgreSQL", icon: SiPostgresql, colorScheme: "blue" },
  datadog: { name: "Datadog", icon: SiDatadog, colorScheme: "purple" },
  nextjs: { name: "Next", icon: SiNextdotjs, colorScheme: "gray" },
  chakra: { name: "Chakra UI", icon: SiChakraui, colorScheme: "teal" },
  storybook: { name: "Storybook", icon: SiStorybook, colorScheme: "pink" },
};

export const projectIdParams = allProjects.map((project) => ({
  params: {
    id: project.id,
  },
}));

export type ProjectDetailParams = {
  id: string;
};

export type ProjectDetailProps = {
  projectData: Project;
};

export const getStaticPaths = async () => {
  const paths = projectIdParams;
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<
  ProjectDetailProps,
  ProjectDetailParams
> = async ({ params }) => {
  const projectData = allProjects.find(
    ({ id }) => id === (params?.id as string)
  );

  if (!projectData) {
    return {
      notFound: true,
    };
  }

  return {
    props: { projectData },
  };
};
