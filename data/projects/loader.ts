import { allProjects, Project } from "contentlayer/generated";
import { GetStaticProps } from "next";

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
