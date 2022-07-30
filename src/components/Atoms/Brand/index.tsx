import { Text, useColorModeValue } from "@chakra-ui/react";

export const Brand = () => (
  <Text
    textAlign={"left"}
    fontFamily={"heading"}
    color={useColorModeValue("gray.800", "white")}
  >
    bcaruso.dev
  </Text>
);
