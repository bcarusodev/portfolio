import { NavItem } from "../../../../types/data";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export const DesktopSubNav = ({ label, href, subLabel }: NavItem) => {
  return (
    <Link
      href={href ?? "#"}
      className="group flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
    >
      <div className="flex-1">
        <span className="block transition-all duration-300 ease-in-out font-medium">
          {label}
        </span>
        <span className="block text-sm text-gray-500 dark:text-gray-400">
          {subLabel}
        </span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 transition-all duration-300 ease-in-out -translate-x-2.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0" />
    </Link>
  );
};
