import { Box, Icon, Flex, Heading, VStack, Container } from "@chakra-ui/react";
import { SKILLS_ITEMS } from "../../data/Skills";
import Feature from "../components/Atoms/Feature";

export const Services = () => {
  return (
    <Container justifyContent={"center"} maxW={"full"}>
      <VStack spacing={20}>
        <VStack>
          <Heading fontWeight={600} fontSize={"4xl"} pb={4}>
            services
          </Heading>
          <Box id={"services"}>
            <Flex gap={10} justifyContent={"center"} flexWrap={"wrap"}>
              {SKILLS_ITEMS.map((item, index) => (
                <Feature
                  key={`skill-${index}`}
                  icon={<Icon as={item.icon} w={10} h={10} />}
                  title={item.title}
                  text={item.description}
                />
              ))}
            </Flex>
          </Box>
        </VStack>
      </VStack>
    </Container>
  );
};
