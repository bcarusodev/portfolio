import { Box, Flex } from "@chakra-ui/react";
import { DesktopNav } from "../../Molecules/DesktopNav";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Atoms/Brand";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { NAV_ITEMS } from "@data/NavItems";
import { MobileNavItem } from "@/components/Atoms/MobileNavItem";
import * as React from "react";
import { HamburgerIcon } from "@chakra-ui/icons";
import { BlurFade } from "@/components/ui/blur-fade";

export default function NavBar() {
  return (
    <Box
      as="header"
      width="100%"
      className={
        "bg-transparent backdrop-blur-xs md:backdrop-blur-0 border-b md:border-b-0 pt-2 md:pt-8"
      }
    >
      <Box className={"max-w-5xl"} mx="auto" width="100%">
        <Flex minH={"60px"} py={{ base: 2 }} px={{ base: 4 }} align={"center"}>
          <Flex
            flex={{ base: 1 }}
            justify={"space-between"}
            alignItems={"center"}
          >
            <BlurFade>
              <Brand className={"ml-2"} />
            </BlurFade>

            <BlurFade>
              <div className={"hidden md:flex"}>
                <DesktopNav />
              </div>
            </BlurFade>
          </Flex>

          <div className={"flex flex-auto flex-end md:hidden justify-end"}>
            <Drawer>
              <DrawerTrigger asChild>
                <Button size={"icon"} variant={"ghost"}>
                  <HamburgerIcon />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className={"overflow-auto p-6"}>
                  {NAV_ITEMS.map(
                    (navItem) =>
                      navItem.enabled && (
                        <MobileNavItem key={navItem.label} {...navItem} />
                      )
                  )}
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </Flex>
      </Box>
    </Box>
  );
}
