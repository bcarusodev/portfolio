import { useColorModeValue, Text, Stack, Flex } from "@chakra-ui/react";
import { ReactElement } from "react";

interface SkillProps {
  title: string;
  text: string;
  icon: ReactElement;
}

export default function Skill({ title, text, icon }: SkillProps) {
  return (
    <Stack
      alignItems={{ base: "center", md: "flex-start" }}
      justifyContent={{ base: "center", md: "flex-start" }}
      textAlign={{ base: "center", md: "unset" }}
      w={{ base: "full", md: 370 }}
      h={{ base: 170, md: 200 }}
      p={2}
    >
      <Flex
        w={16}
        h={16}
        align={"center"}
        justify={{ base: "center", md: "flex-start" }}
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
    </Stack>
  );
}
