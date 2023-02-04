import Layout from "../../components/Atoms/Layout";
import { ProjectDetailProps } from "../../../data/projects/types";

const Project = ({ projectData }: ProjectDetailProps) => {
  return <Layout>Project is: {projectData.description}</Layout>;
};

export { getStaticPaths, getStaticProps } from "../../../data/projects/loader";
export default Project;
