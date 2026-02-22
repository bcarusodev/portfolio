import { ProjectDetailProps } from "@data/work/types";
import Layout from "src/components/Atoms/Layout";
import { useRouter } from "next/router";
import { stacksMap } from "@data/work/loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

const Project = ({ projectData }: ProjectDetailProps) => {
  const router = useRouter();
  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex flex-col items-center gap-10 pt-10 pb-28 text-center">
          <Button
            variant="outline"
            className="text-xs h-7 px-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> All Projects
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight">
            {projectData.title}
          </h1>
          <p className="text-gray-500 tracking-tight">
            {projectData.description}
          </p>
          {projectData.detailImage && (
            <Image
              width={1100}
              height={720}
              className="object-cover"
              src={projectData.detailImage}
              alt={projectData.title}
            />
          )}
          <h2 className="text-xl font-medium tracking-tight">
            Technologies used
          </h2>
          <div className="flex gap-5">
            {projectData.stacks.map((stackId) => {
              const stack = stacksMap[stackId];
              const IconComponent = stack?.icon;
              return (
                <div key={stackId} className="flex flex-col items-center gap-1">
                  <Badge variant="outline" className="rounded-full px-1 py-1">
                    {IconComponent && (
                      <IconComponent size="35px" className="p-1" />
                    )}
                  </Badge>
                  <span className="text-gray-500 text-xs">{stack.name}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-10">
            <div>
              <h3 className="text-sm font-medium uppercase pb-2">Role</h3>
              <p className="text-gray-500">{projectData.role}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium uppercase pb-2">Client</h3>
              <p className="text-gray-500">{projectData.client}</p>
            </div>
            {projectData.projectLink && (
              <div>
                <h3 className="text-sm font-medium uppercase pb-2">URL</h3>
                <Link
                  href={projectData.projectLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 inline-flex items-center hover:underline"
                >
                  {projectData.projectLink.replace(/^https?:\/\//i, "")}
                  <ExternalLink className="w-4 h-4 ml-1 -mt-1" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export { getStaticPaths, getStaticProps } from "@data/work/loader";
export default Project;
