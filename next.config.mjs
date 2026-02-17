import { withContentlayer } from "next-contentlayer";

export default withContentlayer({
  transpilePackages: ["geist"],
  turbopack: {},
});
