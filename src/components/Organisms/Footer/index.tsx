import { Box, Container, Stack, useColorModeValue } from "@chakra-ui/react";
import { Brand } from "../../Atoms/Brand";
import { FooterNotes } from "../../Molecules/FooterNotes";
import { SocialIcons } from "../../Molecules/SocialIcons";

export default function Footer() {
  return (
    <Box
      bg={"transparent"}
      color={useColorModeValue("gray.700", "gray.200")}
      backdropFilter="blur(20px)"
      boxShadow="2xl"
      className={"border-t"}
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
        <Brand onlyLogo />
        <FooterNotes />
        <SocialIcons />
      </Container>
    </Box>
  );
}
