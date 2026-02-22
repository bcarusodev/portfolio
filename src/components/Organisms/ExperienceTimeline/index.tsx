import { EXPERIENCE_ITEMS } from "../../../../data/Experience";
import { TimelineItem } from "../../Molecules/TimelineItem";
import Image from "next/image";

export const ExperienceTimeline = () => {
  return (
    <div className="flex flex-col gap-8">
      {EXPERIENCE_ITEMS.map((item, index) => {
        const iconElement = (
          <div className="border border-gray-300 dark:border-gray-500 rounded-full">
            <Image
              width={47}
              height={47}
              className="object-cover rounded-full shadow-2xl aspect-square"
              src={item.iconSrc as string}
              alt={item.title}
            />
          </div>
        );

        return (
          <TimelineItem
            key={`timeline-item-${index}`}
            iconSrc={iconElement}
            title={item.title}
            subtitle={item.subtitle}
            fromDate={item.fromDate}
            toDate={item.toDate}
            url={item.url}
          />
        );
      })}
    </div>
  );
};
