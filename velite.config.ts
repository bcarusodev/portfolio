import { defineConfig, s } from "velite";

/**
 * Velite Configuration - Migrated from ContentLayer
 *
 * This configuration replaces the previous ContentLayer setup (contentlayer.config.js).
 * Key changes:
 * - Import from "contentlayer/generated" → "@velite"
 * - Export name changed: allProjects → projects
 * - Same schema preserved: title, projectLink, description, topic, client, thumbnail, detailImage, role, stacks
 * - Computed id field derived from filename (same logic as before)
 */
export default defineConfig({
  root: "data",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: {
    projects: {
      name: "Project",
      pattern: "projects/*.md",
      schema: s
        .object({
          title: s.string(),
          projectLink: s.string().optional(),
          description: s.string(),
          topic: s.string(),
          client: s.string(),
          thumbnail: s.string(),
          detailImage: s.string().optional(),
          role: s.string(),
          stacks: s.array(s.string()).default([]),
        })
        .transform((data, { meta }) => ({
          ...data,
          id: meta.basename.replace(/\.md$|\.mdx$/, ""),
        })),
    },
  },
});
