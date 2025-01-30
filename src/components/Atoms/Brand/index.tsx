import { cn } from "@/lib/utils";
import Link from "next/link";

export const Brand = ({
  className,
  onlyLogo = false,
}: {
  className?: string;
  onlyLogo?: boolean;
}) => {
  const common = (
    <>
      <span>bcaruso</span>
      <div
        className={
          "inline-flex items-center rounded-md border px-1 py-0.1 text-xs font-semibold border-transparent bg-black dark:bg-white text-white dark:text-black"
        }
      >
        dev
      </div>
    </>
  );
  const commonClasses = "font-bold flex gap-0.5 items-center";
  if (onlyLogo) {
    return <div className={cn(className, commonClasses)}>{common}</div>;
  } else {
    return (
      <Link
        href={"/"}
        className={cn(
          className,
          commonClasses,
          `hover:scale-105 transition-transform`
        )}
      >
        {common}
      </Link>
    );
  }
};
