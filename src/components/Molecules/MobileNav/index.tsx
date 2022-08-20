import { Stack, useColorModeValue } from "@chakra-ui/react";
import { NAV_ITEMS } from "../../../../data/NavItems";
import { MobileNavItem } from "../../Atoms/MobileNavItem";

export const MobileNav = () => {
  return (
    <Stack
      bg={useColorModeValue("white", "gray.800")}
      p={4}
      display={{ md: "none" }}
    >
      {NAV_ITEMS.map(
        (navItem) =>
          navItem.enabled && <MobileNavItem key={navItem.label} {...navItem} />
      )}
    </Stack>
  );
};
