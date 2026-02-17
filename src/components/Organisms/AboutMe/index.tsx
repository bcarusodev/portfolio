import { Me } from "../../Molecules/Me";
import Title from "@/components/Atoms/Title/title";

export const AboutMe = () => {
  return (
    <div className="max-w-3xl mx-auto p-0">
      <div className="flex flex-col gap-20">
        <div className="flex flex-col gap-4">
          <Title>About Me</Title>
          <div id="about-me">
            <div className="flex gap-5 justify-center flex-wrap">
              <Me />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
