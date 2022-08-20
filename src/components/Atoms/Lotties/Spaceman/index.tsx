import Lottie from "lottie-react";
import { Box } from "@chakra-ui/react";
import React from "react";
import AnimationData from "./anim_data.json";

export const Spaceman = () => (
  <Box width={{ base: 400, md: 600 }}>
    <Lottie animationData={AnimationData} loop={true} />
  </Box>
);
