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
    <div className="flex w-full gap-4">
      {iconSrc}
      <div className="flex min-w-[230px] justify-between w-full">
        <Link
          target="_blank"
          href={url}
          className="flex flex-col items-start gap-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 group relative animate-rainbow bg-[length:200%] text-foreground before:absolute before:bottom-[-20%] before:left-1/2 before:z-[0] before:h-[20%] before:w-[60%] before:-translate-x-1/2"
        >
          <h3 className="inline-flex items-center justify-center font-semibold leading-none text-xs sm:text-sm">
            {title}{" "}
            <ChevronRight className="w-[16px] lucide lucide-chevron-right ml-1 size-4 shrink-0 transition-all duration-300 ease-out group-hover:translate-x-1 opacity-0 group-hover:opacity-100" />
          </h3>
          <p className="font-sans text-xs">{subtitle}</p>
          {description && (
            <p className="text-gray-500 text-sm">{description}</p>
          )}
        </Link>
        <p className="text-xs sm:text-sm tabular-nums text-muted-foreground text-right tracking-wide">
          {/* From Date */}
          {`${parseDate(fromDate)}`}
          {/* To Date (if set) */}
          {toDate &&
            ` - ${toDate instanceof Date ? parseDate(toDate) : "Present"}`}
        </p>
      </div>
    </div>
  );
};
