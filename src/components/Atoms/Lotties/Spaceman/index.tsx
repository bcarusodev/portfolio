import Lottie from "lottie-react";
import React from "react";
import AnimationData from "./anim_data.json";

export const Spaceman = () => (
  <div className="w-[400px] md:w-[600px]">
    <Lottie animationData={AnimationData} loop={true} />
  </div>
);
