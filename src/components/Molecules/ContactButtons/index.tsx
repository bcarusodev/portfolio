import Link from "next/link";
import {
  Button,
  HStack,
  SlideFade,
  Stack,
  useDisclosure,
} from "@chakra-ui/react";
import React from "react";
import { ArrowForwardIcon, EmailIcon } from "@chakra-ui/icons";

export const ContactButtons = () => {
  const { isOpen, onToggle } = useDisclosure();
  return (
    <Stack direction={{ base: "column", sm: "row" }}>
      {!isOpen && (
        <Button size={"lg"} fontWeight={"normal"} px={6} onClick={onToggle}>
          Get in touch
        </Button>
      )}
      <SlideFade in={isOpen}>
        <HStack spacing={2}>
          <Link href={"mailto:brunofcaruso@gmail.com"}>
            <Button
              leftIcon={<EmailIcon />}
              size={"lg"}
              w={"full"}
              fontWeight={"normal"}
              px={6}
            >
              Email
            </Button>
          </Link>
          <Link href={"https://www.calendly.com/brunofcaruso"}>
            <Button
              rightIcon={<ArrowForwardIcon />}
              size={"lg"}
              w={"full"}
              fontWeight={"normal"}
              px={6}
            >
              Calendly
            </Button>
          </Link>
        </HStack>
      </SlideFade>
    </Stack>
  );
};
