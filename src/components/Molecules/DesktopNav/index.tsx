import {
  Box,
  Button,
  Fade,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { NAV_ITEMS } from "../../../../data/NavItems";
import { DarkModeSwitch } from "../../Atoms/DarkModeSwitch";
import { DesktopSubNav } from "./DesktopSubNav";

export const DesktopNav = () => {
  const linkColor = useColorModeValue("gray.600", "gray.200");
  const popoverContentBgColor = useColorModeValue("white", "gray.800");
  const router = useRouter();

  return (
    <Stack direction={"row"} spacing={4} alignItems={"center"}>
      {NAV_ITEMS.map(
        (navItem, index) =>
          navItem.enabled && (
            <Box key={navItem.label}>
              <Fade in>
                <Popover trigger={"hover"} placement={"bottom-start"}>
                  <PopoverTrigger>
                    <Button
                      key={`navlink-${index}`}
                      onClick={() => router.push(navItem.href)}
                      fontSize={"sm"}
                      fontWeight={500}
                      variant={"ghost"}
                      color={linkColor}
                    >
                      {navItem.label}
                    </Button>
                  </PopoverTrigger>

                  {navItem.children && (
                    <PopoverContent
                      border={0}
                      boxShadow={"xl"}
                      bg={popoverContentBgColor}
                      p={4}
                      rounded={"xl"}
                      minW={"sm"}
                    >
                      <Stack>
                        {navItem.children.map((child) => (
                          <DesktopSubNav key={child.label} {...child} />
                        ))}
                      </Stack>
                    </PopoverContent>
                  )}
                </Popover>
              </Fade>
            </Box>
          )
      )}
      <DarkModeSwitch />
    </Stack>
  );
};
