import { HStack, Container, VStack, Heading, Text } from "@chakra-ui/react";
import { TimelineItem as ITimelineItem } from "../../../types/data";

export const TimelineItem = ({
  icon,
  fromDate,
  toDate,
  title,
  subtitle,
  description,
}: ITimelineItem) => {
  const shortMonthName = new Intl.DateTimeFormat("en-US", { month: "short" })
    .format;
  const parseDate = (date: Date) =>
    shortMonthName(date) + ". " + date.getUTCFullYear();

  return (
    <HStack>
      {icon}
      <Container minWidth={230}>
        <VStack alignItems={"flex-start"}>
          <Heading color={"gray.500"} fontSize="xs" textTransform={"uppercase"}>
            {/* From Date */}
            {`${parseDate(fromDate)}`}
            {/* To Date (if set) */}
            {toDate &&
              ` - ${toDate instanceof Date ? parseDate(toDate) : "Present"}`}
          </Heading>
          <Heading size="md">{title}</Heading>
          <Heading color={"gray.500"} size="xs">
            {subtitle}
          </Heading>
          {description && <Text color="gray.500">{description}</Text>}
        </VStack>
      </Container>
    </HStack>
  );
};
