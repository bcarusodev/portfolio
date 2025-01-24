import {
  Button,
  HStack,
  SlideFade,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import React from "react";
import {
  ArrowBackIcon,
  ArrowForwardIcon,
  CalendarIcon,
  EmailIcon,
} from "@chakra-ui/icons";
import { useRouter } from "next/router";

export const ContactButtons = () => {
  const { isOpen, onToggle } = useDisclosure();
  const router = useRouter();
  return (
    <Stack direction={{ base: "column", sm: "row" }}>
      {!isOpen && (
        <SlideFade in={!isOpen} hidden={isOpen}>
          <HStack>
            <Button
              size={"md"}
              w={{ base: "full" }}
              fontWeight={"normal"}
              px={5}
              variant={"outline"}
              onClick={onToggle}
            >
              Get in touch
            </Button>
            <a
              href="https://drive.google.com/file/d/1Ah-AHDGnKmbtHz2wUOUdlReLaUwcjefY/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size={"md"} fontWeight={"normal"} variant={"outline"}>
                Resume
              </Button>
            </a>
            <Button
              size={"md"}
              rightIcon={<ArrowForwardIcon />}
              fontWeight={"normal"}
              variant={"outline"}
              px={5}
              w={{ base: "full" }}
              onClick={() => router.push("/work")}
            >
              See Work
            </Button>
          </HStack>
        </SlideFade>
      )}
      <SlideFade in={isOpen} hidden={!isOpen}>
        <HStack spacing={2}>
          <Button
            size={"md"}
            variant={"outline"}
            fontWeight={"normal"}
            onClick={onToggle}
          >
            <ArrowBackIcon />
          </Button>
          <a href={"mailto:hello@bcaruso.dev"}>
            <Button
              leftIcon={<EmailIcon />}
              size={"md"}
              w={"full"}
              variant={"outline"}
              fontWeight={"normal"}
              px={6}
            >
              hello@bcaruso.dev
            </Button>
          </a>
          <a
            href={"https://www.calendly.com/brunofcaruso"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              leftIcon={<CalendarIcon />}
              size={"md"}
              w={"full"}
              variant={"outline"}
              fontWeight={"normal"}
              px={6}
            >
              Calendly
            </Button>
          </a>
        </HStack>
      </SlideFade>
    </Stack>
  );
};
