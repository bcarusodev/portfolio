import { Box, Container, Stack, useColorModeValue } from "@chakra-ui/react";
import { Brand } from "../../Atoms/Brand";
import { FooterNotes } from "../../Molecules/FooterNotes";
import { SocialIcons } from "../../Molecules/SocialIcons";

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
        <Brand />
        <FooterNotes />
        <SocialIcons />
      </Container>
    </Box>
  );
}
