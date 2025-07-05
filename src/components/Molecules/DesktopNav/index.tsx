import {
  Box,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react";
import { NAV_ITEMS } from "../../../../data/NavItems";
import { DarkModeSwitch } from "../../Atoms/DarkModeSwitch";
import { DesktopSubNav } from "./DesktopSubNav";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const DesktopNav = () => {
  const linkColor = useColorModeValue("gray.600", "gray.200");
  const popoverContentBgColor = useColorModeValue("white", "gray.800");

  return (
    <Stack direction={"row"} spacing={4} alignItems={"center"}>
      {NAV_ITEMS.map(
        (navItem, index) =>
          navItem.enabled && (
            <Box key={navItem.label}>
              <Popover trigger={"hover"} placement={"bottom-start"}>
                <PopoverTrigger>
                  <Link href={navItem.href}>
                    <Button
                      key={`navlink-${index}`}
                      className={"text-sm tracking-tight"}
                      variant={"link"}
                      color={linkColor}
                      asChild={true}
                    >
                      <div className="group w-fit">
                        <span className="relative cursor-pointer block after:block after:content-[''] after:absolute after:h-[2px] after:mt-1 after:bg-black after:dark:bg-white after:w-full after:scale-x-0 after:transition after:duration-300 after:origin-right group-hover:after:scale-x-100 group-hover:after:origin-left">
                          {navItem.label}
                        </span>
                      </div>
                    </Button>
                  </Link>
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
            </Box>
          )
      )}
      <DarkModeSwitch />
    </Stack>
  );
};
