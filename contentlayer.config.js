import { defineDocumentType, makeSource } from "contentlayer/source-files";
import rehypeRaw from "rehype-raw";
import remarkHtml from "remark-html";

export const Project = defineDocumentType(() => ({
  name: "Project",
  filePathPattern: "projects/*.md",
  fields: {
    title: { type: "string", required: true },
    projectLink: { type: "string", required: true },
    description: { type: "string", required: true },
    topic: { type: "string", required: true },
    workedOn: { type: "string", required: true },
    thumbnail: { type: "string", required: true },
    stacks: { type: "list", of: { type: "string" } },
  },
  computedFields: {
    id: {
      type: "string",
      // eslint-disable-next-line no-underscore-dangle
      resolve: (project) =>
        project._raw.sourceFileName.replace(/\.md$|\.mdx$/, ""),
    },
  },
}));

export default makeSource({
  contentDirPath: "data",
  documentTypes: [Project],
  markdown: {
    remarkPlugins: [remarkHtml],
    rehypePlugins: [rehypeRaw],
  },
});
