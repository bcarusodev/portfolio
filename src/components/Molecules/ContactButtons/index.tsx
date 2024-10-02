import Link from "next/link";
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
              size={"lg"}
              w={{ base: "full" }}
              fontWeight={"normal"}
              px={5}
              onClick={onToggle}
            >
              Get in touch
            </Button>
            <Button
              size={"lg"}
              rightIcon={<ArrowForwardIcon />}
              fontWeight={"normal"}
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
          <Button size={"lg"} fontWeight={"normal"} onClick={onToggle}>
            <ArrowBackIcon />
          </Button>
          <a href={"mailto:hello@bcaruso.dev"}>
            <Button
              leftIcon={<EmailIcon />}
              size={"lg"}
              w={"full"}
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
              size={"lg"}
              w={"full"}
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
