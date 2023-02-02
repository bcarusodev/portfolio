import { useRouter } from "next/router";
import { allProjects } from "contentlayer/generated";
import Layout from "../../components/Atoms/Layout";

const Project = () => {
  const router = useRouter();
  const { project } = router.query;
  const projectData = allProjects.find(({ id }) => id === (project as string));
  return <Layout>Project is: {projectData?.title}</Layout>;
};

export default Project;
