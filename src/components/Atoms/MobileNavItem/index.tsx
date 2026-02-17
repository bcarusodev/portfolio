import { NavItem } from "@/types/data";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export const MobileNavItem = ({ label, children, href }: NavItem) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleClick = children ? () => setIsOpen(!isOpen) : undefined;

  return (
    <div className="space-y-8 px-2" onClick={handleClick}>
      <Link
        href={href ?? "#"}
        className="flex py-3 justify-between items-center no-underline hover:no-underline"
      >
        <span className="group inline-flex items-center text-xl">{label}</span>
        {children && (
          <ChevronDown
            className={`w-6 h-6 transition-transform duration-250 ease-in-out ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </Link>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ marginTop: "0!important" }}
      >
        <div className="mt-2 pl-4 border-l border-gray-200 dark:border-gray-700 flex flex-col items-start">
          {children &&
            children.map((child) => (
              <Link key={child.label} className="py-2" href={child.href}>
                {child.label}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};
