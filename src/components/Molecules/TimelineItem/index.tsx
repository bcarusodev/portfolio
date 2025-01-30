import { HStack, VStack, Text } from "@chakra-ui/react";
import { TimelineItem as ITimelineItem } from "../../../types/data";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import React from "react";

export const TimelineItem = ({
  iconSrc,
  fromDate,
  toDate,
  title,
  subtitle,
  description,
  url,
}: ITimelineItem) => {
  const shortMonthName = new Intl.DateTimeFormat("en-US", { month: "long" })
    .format;
  const parseDate = (date: Date) =>
    shortMonthName(date) + " " + date.getUTCFullYear();

  return (
    <HStack w={"full"}>
      {iconSrc}
      <HStack minWidth={230} justifyContent={"space-between"} w={"full"}>
        <VStack
          alignItems={"flex-start"}
          spacing={1}
          as={Link}
          target={"_blank"}
          href={url}
          className={
            "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 group relative animate-rainbow cursor-pointer bg-[length:200%] text-foreground before:absolute before:bottom-[-20%] before:left-1/2 before:z-[0] before:h-[20%] before:w-[60%] before:-translate-x-1/2 inline-flex"
          }
        >
          <h3 className="inline-flex items-center justify-center font-semibold leading-none text-xs sm:text-sm">
            {title}{" "}
            <ChevronRight
              className={
                "w-[16px] lucide lucide-chevron-right ml-1 size-4 shrink-0 transition-all duration-300 ease-out group-hover:translate-x-1 opacity-0 group-hover:opacity-100"
              }
            />
          </h3>
          <p className={"font-sans text-xs"}>{subtitle}</p>
          {description && <Text color="gray.500">{description}</Text>}
        </VStack>
        <p
          className={
            "text-xs sm:text-sm tabular-nums text-muted-foreground text-right tracking-wide"
          }
        >
          {/* From Date */}
          {`${parseDate(fromDate)}`}
          {/* To Date (if set) */}
          {toDate &&
            ` - ${toDate instanceof Date ? parseDate(toDate) : "Present"}`}
        </p>
      </HStack>
    </HStack>
  );
};
