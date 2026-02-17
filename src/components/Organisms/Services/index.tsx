import { SKILLS_ITEMS } from "@data/Skills";
import Feature from "../../Atoms/Feature";
import Title from "@/components/Atoms/Title/title";
import { BlurFade } from "@/components/ui/blur-fade";
import constants from "@/constants";

export const Services = () => {
  return (
    <div className="flex justify-center max-w-full">
      <div className="flex flex-col gap-20">
        <div className="flex flex-col gap-4">
          <BlurFade inView>
            <Title>Services</Title>
          </BlurFade>
          <div id="services">
            <div className="flex gap-5 justify-center flex-wrap">
              {SKILLS_ITEMS.map((item, index) => (
                <BlurFade
                  key={`skill-${index}`}
                  delay={constants.BLUR_FADE_DELAY + index * 0.05}
                  inView
                  className="w-full md:w-auto"
                >
                  <Feature
                    icon={<item.icon className="w-10 h-10" />}
                    title={item.title}
                    text={item.description}
                  />
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
