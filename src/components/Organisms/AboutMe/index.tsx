import { Box, Flex, VStack, Container } from "@chakra-ui/react";
import { Me } from "../../Molecules/Me";
import Title from "@/components/Atoms/Title/title";

export const AboutMe = () => {
  return (
    <Container justifyContent={"center"} maxW={"3xl"} padding={0}>
      <VStack spacing={20}>
        <VStack>
          <Title>About Me</Title>
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
