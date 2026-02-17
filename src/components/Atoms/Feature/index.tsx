import { useColorModeValue, Flex } from "@chakra-ui/react";
import { ReactElement } from "react";
import { MagicCard } from "@/components/ui/magic-card";

interface FeatureProps {
  title: string;
  text: string;
  icon: ReactElement;
}

export default function Feature({ title, text, icon }: FeatureProps) {
  const bgColor = useColorModeValue(
    "linear(to-l, heroGradientStart, heroGradientEnd)",
    "transparent"
  );

  return (
    <MagicCard
      gradientOpacity={0}
      className="flex cursor-pointer flex-col items-center justify-center text-center w-full h-[170px] px-6 py-4 md:items-start md:justify-center md:text-left md:w-[370px] md:h-[200px]"
    >
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore - Chakra UI Flex produces complex union types */}
      <Flex
        align="center"
        justify={{ base: "center", md: "flex-start" }}
        justifySelf={{ base: "center", md: "flex-start" }}
        backgroundColor={bgColor}
        mb={1}
      >
        {icon}
      </Flex>
      <span className="font-semibold">{title}</span>
      <p className="text-gray-500">{text}</p>
    </MagicCard>
  );
}
