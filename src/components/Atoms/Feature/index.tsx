import { ReactElement } from "react";
import { MagicCard } from "@/components/ui/magic-card";

interface FeatureProps {
  title: string;
  text: string;
  icon: ReactElement;
}

export default function Feature({ title, text, icon }: FeatureProps) {
  return (
    <MagicCard
      gradientOpacity={0}
      className="flex cursor-pointer flex-col items-center justify-center text-center w-full h-[170px] px-6 py-4 md:items-start md:justify-center md:text-left md:w-[370px] md:h-[200px]"
    >
      <div className="flex items-center justify-center md:justify-start self-center md:self-start mb-1">
        {icon}
      </div>
      <span className="font-semibold">{title}</span>
      <p className="text-gray-500">{text}</p>
    </MagicCard>
  );
}
