import { NavItem } from "../../../../types/data";
import {
  Box,
  Flex,
  Icon,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import Link from "next/link";

export const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  const hoverBg = useColorModeValue("gray.50", "gray.900");

  return (
    <Link
      href={href ?? "#"}
      className="group block p-2 rounded-md transition-colors"
      style={{ backgroundColor: "transparent" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {/* @ts-ignore */}
      <Stack direction="row" align="center">
        <Box>
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore - Chakra UI Text produces complex union types */}
          <Text transition="all .3s ease" fontWeight={500}>
            {label}
          </Text>
          <Text fontSize="sm">{subLabel}</Text>
        </Box>
        {/* @ts-ignore */}
        <Flex
          transition="all .3s ease"
          transform="translateX(-10px)"
          opacity={0}
          _groupHover={{ opacity: "100%", transform: "translateX(0)" }}
          justify="flex-end"
          align="center"
          flex={1}
        >
          <Icon color="gray.400" w={5} h={5} as={ChevronRightIcon} />
        </Flex>
      </Stack>
    </Link>
  );
};
