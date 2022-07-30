import {
  Box,
  Container,
  Stack,
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa";
import { SiChakraui } from "react-icons/si";
import { TbBrandNextjs, TbBrandVercel } from "react-icons/tb";
import { SocialIcon } from "../Atoms/Icons/SocialIcon";

export default function Footer() {
  return (
    <Box
      mt={28}
      bg={useColorModeValue("gray.50", "gray.900")}
      color={useColorModeValue("gray.700", "gray.200")}
    >
      <Container
        as={Stack}
        maxW={"6xl"}
        py={4}
        direction={{ base: "column", md: "row" }}
        spacing={4}
        justify={{ base: "center", md: "space-between" }}
        align={{ base: "center", md: "center" }}
      >
        <Text fontSize={"lg"}>bcaruso.dev</Text>
        <Stack align={{ base: "center", md: "center" }} spacing={1}>
          <Text fontSize={"sm"}>Developed with ❤️ by Bruno Caruso</Text>
          <Stack
            direction={"row"}
            alignItems={"center"}
            justifyContent={"center"}
          >
            <Text fontSize={"xs"}>Built using</Text>
            <Tooltip
              hasArrow
              label="NextJS"
              bg={useColorModeValue("gray.700", "gray.100")}
              color={useColorModeValue("gray.100", "gray.700")}
            >
              <div>
                <TbBrandNextjs size={25} />
              </div>
            </Tooltip>
            <Tooltip
              hasArrow
              label="Vercel"
              bg={useColorModeValue("gray.700", "gray.100")}
              color={useColorModeValue("gray.100", "gray.700")}
            >
              <div>
                <TbBrandVercel size={25} />
              </div>
            </Tooltip>
            <Tooltip
              hasArrow
              label="Chakra"
              bg={useColorModeValue("gray.700", "gray.100")}
              color={useColorModeValue("gray.100", "gray.700")}
            >
              <div>
                <SiChakraui size={25} />
              </div>
            </Tooltip>
          </Stack>
        </Stack>
        <Stack direction={"row"} spacing={6}>
          <SocialIcon
            label={"LinkedIn"}
            href={"https://www.linkedin.com/in/brunocarusok"}
          >
            <FaLinkedinIn />
          </SocialIcon>
          <SocialIcon
            label={"YouTube"}
            href={"https://www.youtube.com/user/silvergraphs"}
          >
            <FaYoutube />
          </SocialIcon>
          <SocialIcon
            label={"Instagram"}
            href={"https://www.instagram.com/brunofcaruso"}
          >
            <FaInstagram />
          </SocialIcon>
        </Stack>
      </Container>
    </Box>
  );
}
