import React from "react";
import {
  Badge,
  Container,
  Fade,
  Heading,
  HStack,
  Stack,
  Icon,
  VStack,
  useColorModeValue,
  Text,
  Image,
  Show,
  Link,
  Button,
  Box,
  Flex,
} from "@chakra-ui/react";
import { AboutMe } from "../components/Organisms/AboutMe";
import { MdLanguage } from "react-icons/md";
import { TimelineItem } from "../components/Molecules/TimelineItem";
import { FaGoogleDrive, FaMedal, FaWindows } from "react-icons/fa";
import { ExperienceTimeline } from "../components/Organisms/ExperienceTimeline";
import { SiMacos } from "react-icons/si";
import { useRouter } from "next/router";
import { TECHNOLOGIES } from "../../data/Technologies";

const About = () => {
  const router = useRouter();
  return (
    <Fade in={true}>
      <Container maxW={"7xl"}>
        <VStack spacing={10} pt={10}>
          <AboutMe />

          <Stack direction={["column", "row"]} spacing={[10, 20]}>
            <VStack>
              <Heading fontWeight={300} fontSize={"2xl"} pb={4}>
                education & certs.
              </Heading>
              <VStack spacing={10}>
                <TimelineItem
                  icon={<Icon as={MdLanguage} w={8} h={8} />}
                  title="EF SET C1 Advanced"
                  subtitle="EF International Campuses"
                  fromDate={new Date("2022-07-1")}
                />
                <TimelineItem
                  icon={<Icon as={FaMedal} w={8} h={8} />}
                  title="Software Olympics"
                  subtitle="INET"
                  fromDate={new Date("2018-11-1")}
                />
                <TimelineItem
                  icon={<Icon as={FaMedal} w={8} h={8} />}
                  title="IT Technician"
                  subtitle="EEST N8"
                  fromDate={new Date("2018-11-1")}
                />
              </VStack>
            </VStack>

            <VStack>
              <Heading fontWeight={300} fontSize={"2xl"} pb={4}>
                experience
              </Heading>
              <ExperienceTimeline />
            </VStack>
          </Stack>

          <Button
            size={"lg"}
            fontWeight={"normal"}
            leftIcon={<FaGoogleDrive />}
            onClick={() =>
              router.push(
                "https://drive.google.com/file/d/1GcJ7z8lU_nnlA4cSd-axYvbGflDlMNMV/view?usp=sharing"
              )
            }
          >
            Full Resume
          </Button>

          <Container justifyContent={"center"} maxW={"full"}>
            <VStack spacing={20}>
              <VStack>
                <Heading fontWeight={600} fontSize={"4xl"} pb={6}>
                  technologies
                </Heading>
                <Box id={"services"}>
                  <Flex gap={2} justifyContent={"center"} flexWrap={"wrap"}>
                    {TECHNOLOGIES.map((tech, index) => (
                      <Badge
                        key={`tech-${index}`}
                        colorScheme={tech.colorScheme}
                        px={2}
                      >
                        {tech.name}
                      </Badge>
                    ))}
                  </Flex>
                </Box>
              </VStack>
            </VStack>
          </Container>

          <Heading fontWeight={600} fontSize={"4xl"}>
            my workstation
          </Heading>
          <Text align="center" color={"gray.500"}>
            <p>ASRock X370M-HDV R4.0</p>
            <p>AMD Ryzen 5 1600 AF @ 4.0 GHz - Thermaltake Contac Silent 12</p>
            <p>16GB RAM XPG Hunter DDR4 @ 3000 MHz</p>
            <p>ASRock Phantom Gaming D RX 570 4G</p>
            <p>
              1x XPG S40G Spectrix NVMe + 1x Kingston UV400 SSD + 2x WD Caviar
              Blue 7200rpm HDD
            </p>
            <p>Corsair Carbide 100R</p>
            <p>Windows 11 & macOS Big Sur dual-boot (OpenCore)</p>
          </Text>
          <Show below="md">
            <HStack spacing={10}>
              <FaWindows size={"5rem"} />
              <SiMacos size={"5rem"} />
            </HStack>
          </Show>
          <Show above="md">
            <Link href="/assets/images/desktop_workstation.png" isExternal>
              <Image
                loading={"eager"}
                fit={"cover"}
                align={"center"}
                boxShadow={useColorModeValue("2xl", "unset")}
                width={700}
                src={"/assets/images/desktop_workstation.png"}
              />
            </Link>
          </Show>
        </VStack>
      </Container>
    </Fade>
  );
};

export default About;
