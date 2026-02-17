import { IconType } from "react-icons";
import type { Project } from "contentlayer/generated";

export type ProjectDetailParams = {
  id: string;
};

export type ProjectDetailProps = {
  projectData: Project;
};

export type ProjectStackProps = {
  name: string;
  icon: IconType;
  colorScheme: string;
};
