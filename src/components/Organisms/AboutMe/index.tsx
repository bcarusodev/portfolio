import { Box, Flex, Heading, VStack, Container } from "@chakra-ui/react";
import { Me } from "../../Molecules/Me";

export const AboutMe = () => {
  return (
    <Container justifyContent={"center"} maxW={"full"}>
      <VStack spacing={20}>
        <VStack>
          <Heading
            fontWeight={600}
            fontSize={"4xl"}
            letterSpacing={"-1px"}
            pb={4}
          >
            about me
          </Heading>
          <Box id={"about-me"}>
            <Flex gap={5} justifyContent={"center"} flexWrap={"wrap"}>
              <Me />
            </Flex>
          </Box>
        </VStack>
      </VStack>
    </Container>
  );
};
