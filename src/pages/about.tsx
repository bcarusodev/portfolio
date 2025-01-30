import React from "react";
import { Container, VStack, Box } from "@chakra-ui/react";
import { AboutMe } from "../components/Organisms/AboutMe";
import { ExperienceTimeline } from "../components/Organisms/ExperienceTimeline";
import { TECHNOLOGIES } from "../../data/Technologies";
import Layout from "../components/Atoms/Layout";
import { CopyIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const About = () => {
  const handleCopyToClipboard = () => {
    navigator.clipboard
      .writeText("contact@bcaruso.dev")
      .then(() =>
        toast("Copied to clipboard!", {
          action: {
            label: "X",
            onClick: () => toast.dismiss(),
          },
        })
      )
      .catch((err) => console.error("Error copying: ", err));
  };
  return (
    <Layout>
      <Container maxW={"7xl"}>
        <VStack spacing={8} pt={10} pb={28} className={"max-w-3xl mx-auto"}>
          <AboutMe />

          <div className={"flex min-h-0 flex-col gap-y-3 max-w-full w-full"}>
            <h2
              className={
                "mb-2 text-2xl font-bold leading-[1.2] tracking-tighter text-foreground text-start w-full"
              }
            >
              Work Experience
            </h2>
            <ExperienceTimeline />
          </div>

          <div className={"flex flex-row gap-2"}>
            <a
              href="https://drive.google.com/file/d/1Ah-AHDGnKmbtHz2wUOUdlReLaUwcjefY/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant={"outline"}>
                Resume <ExternalLinkIcon />
              </Button>
            </a>
            <Button variant={"outline"} onClick={() => handleCopyToClipboard()}>
              contact@bcaruso.dev <CopyIcon />
            </Button>
          </div>

          <Container p={0} maxW={"full"}>
            <VStack spacing={20}>
              <VStack>
                <h2
                  className={
                    "mb-2 text-2xl font-bold leading-[1.2] tracking-tighter text-foreground text-start w-full"
                  }
                >
                  Skills
                </h2>
                <Box id={"technologies"}>
                  <div className={"flex flex-wrap justify-start gap-2"}>
                    {Object.keys(TECHNOLOGIES).map((key) => (
                      <Badge key={`tech-${key}`} className={"px-3"}>
                        {TECHNOLOGIES[key].name}
                      </Badge>
                    ))}
                  </div>
                </Box>
              </VStack>
            </VStack>
          </Container>

          <div className={"w-full"}>
            <h2
              className={
                "mb-2 text-2xl font-bold leading-[1.2] tracking-tighter text-foreground text-start w-full"
              }
            >
              My Workstation
            </h2>
            <div
              className={
                "prose text-pretty font-sans text-sm text-muted-foreground dark:prose-invert"
              }
            >
              <p>Gigabyte B550 AORUS ELITE AX V2</p>
              <p>AMD Ryzen 7 5700X - Thermaltake Contac Silent 12</p>
              <p>16GB RAM XPG Hunter DDR4 @ 3200 MHz</p>
              <p>Sapphire Nitro+ RX 6700 XT 12G</p>
              <p>WD Blue SN580 1TB NVMe</p>
              <p>XPG S40G Spectrix 256GB NVMe</p>
              <p>Corsair Carbide 100R</p>
              <p>Windows 11 & macOS dual-boot (OpenCore)</p>
            </div>
          </div>
        </VStack>
      </Container>
    </Layout>
  );
};

export default About;
