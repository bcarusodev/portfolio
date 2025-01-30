import { useColorModeValue, Text, Flex } from "@chakra-ui/react";
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
      <Flex
        align={"center"}
        justify={{ base: "center", md: "flex-start" }}
        justifySelf={{ base: "center", md: "flex-start" }}
        color={useColorModeValue(
          "linear(to-l, heroGradientStart, heroGradientEnd)",
          "white"
        )}
        mb={1}
      >
        {icon}
      </Flex>
      <Text fontWeight={600}>{title}</Text>
      <Text color={"gray.500"}>{text}</Text>
    </MagicCard>
  );
}
