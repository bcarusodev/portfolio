import { Box, Icon, Flex, VStack, Container } from "@chakra-ui/react";
import { SKILLS_ITEMS } from "@data/Skills";
import Feature from "../../Atoms/Feature";
import Title from "@/components/Atoms/Title/title";
import { BlurFade } from "@/components/ui/blur-fade";
import constants from "@/constants";

export const Services = () => {
  return (
    <Container justifyContent={"center"} maxW={"full"}>
      <VStack spacing={20}>
        <VStack>
          <BlurFade inView>
            <Title>Services</Title>
          </BlurFade>
          <Box id={"services"}>
            <Flex gap={5} justifyContent={"center"} flexWrap={"wrap"}>
              {SKILLS_ITEMS.map((item, index) => (
                <BlurFade
                  key={`skill-${index}`}
                  delay={constants.BLUR_FADE_DELAY + index * 0.05}
                  inView
                  className={"w-full md:w-auto"}
                >
                  <Feature
                    icon={<Icon as={item.icon} w={10} h={10} />}
                    title={item.title}
                    text={item.description}
                  />
                </BlurFade>
              ))}
            </Flex>
          </Box>
        </VStack>
      </VStack>
    </Container>
  );
};
