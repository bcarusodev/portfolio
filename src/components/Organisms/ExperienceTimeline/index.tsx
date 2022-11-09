import { VStack, Icon } from "@chakra-ui/react";
import { EXPERIENCE_ITEMS } from "../../../../data/Experience";
import { TimelineItem } from "../../Molecules/TimelineItem";

export const ExperienceTimeline = () => {
  return (
    <VStack spacing={10}>
      {EXPERIENCE_ITEMS.map((item, index) => (
        <TimelineItem
          key={`timeline-item-${index}`}
          icon={<Icon as={item.icon} w={8} h={8} />}
          title={item.title}
          subtitle={item.subtitle}
          fromDate={item.fromDate}
          toDate={item.toDate}
        />
      ))}
    </VStack>
  );
};
