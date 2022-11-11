import { Text, useColorModeValue } from "@chakra-ui/react";

export const Brand = () => (
  <Text
    textAlign={"left"}
    fontFamily={"Plus Jakarta Sans"}
    fontWeight={400}
    letterSpacing={"-1px"}
    fontSize={"lg"}
    color={useColorModeValue("gray.800", "white")}
  >
    bcaruso.dev
  </Text>
);
