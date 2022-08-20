import { SocialIcon } from "../../Atoms/Icons/SocialIcon";
import { FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa";
import { Stack } from "@chakra-ui/react";

export const SocialIcons = () => (
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
);
