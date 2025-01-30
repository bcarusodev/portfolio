import { VStack, Avatar } from "@chakra-ui/react";
import { EXPERIENCE_ITEMS } from "../../../../data/Experience";
import { TimelineItem } from "../../Molecules/TimelineItem";

export const ExperienceTimeline = () => {
  return (
    <VStack spacing={8}>
      {EXPERIENCE_ITEMS.map((item, index) => (
        <TimelineItem
          key={`timeline-item-${index}`}
          iconSrc={
            <Avatar
              src={item.iconSrc.src}
              width={12}
              height={12}
              border={"1px solid #e5e7eb"}
            />
          }
          title={item.title}
          subtitle={item.subtitle}
          fromDate={item.fromDate}
          toDate={item.toDate}
          url={item.url}
        />
      ))}
    </VStack>
  );
};
