import { Text, useColorModeValue } from "@chakra-ui/react";

export const Brand = ({ size }: { size?: string }) => (
  <Text
    textAlign={"left"}
    fontFamily={"Plus Jakarta Sans"}
    fontWeight={400}
    letterSpacing={"-1px"}
    fontSize={size ?? "xl"}
    color={useColorModeValue("gray.800", "white")}
  >
    bcaruso.dev
  </Text>
);
