import { SocialIcon } from "../../Atoms/Icons/SocialIcon";
import { FaInstagram, FaLinkedinIn, FaYoutube, FaGithub } from "react-icons/fa";

export const SocialIcons = () => (
  <div className="flex flex-row gap-2">
    <SocialIcon
      label="LinkedIn"
      href="https://www.linkedin.com/in/brunocarusok"
    >
      <FaLinkedinIn />
    </SocialIcon>
    <SocialIcon label="GitHub" href="https://www.github.com/bcarusodev">
      <FaGithub />
    </SocialIcon>
    <SocialIcon
      label="YouTube"
      href="https://www.youtube.com/user/silvergraphs"
    >
      <FaYoutube />
    </SocialIcon>
    <SocialIcon label="Instagram" href="https://www.instagram.com/brunofcaruso">
      <FaInstagram />
    </SocialIcon>
  </div>
);
