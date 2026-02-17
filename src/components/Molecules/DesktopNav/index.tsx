import { NAV_ITEMS } from "../../../../data/NavItems";
import { DarkModeSwitch } from "../../Atoms/DarkModeSwitch";
import { DesktopSubNav } from "./DesktopSubNav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export const DesktopNav = () => {
  return (
    <div className="flex items-center gap-4">
      {NAV_ITEMS.map(
        (navItem, index) =>
          navItem.enabled && (
            <div key={navItem.label}>
              {navItem.children ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="group w-fit cursor-pointer">
                      <span className="relative cursor-pointer block text-sm tracking-tight text-gray-600 dark:text-gray-200 after:block after:content-[''] after:absolute after:h-[2px] after:mt-1 after:bg-black after:dark:bg-white after:w-full after:scale-x-0 after:transition after:duration-300 after:origin-right group-hover:after:scale-x-100 group-hover:after:origin-left">
                        {navItem.label}
                      </span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white dark:bg-gray-800 border-0 shadow-xl rounded-xl p-4">
                    {navItem.children.map((child) => (
                      <DropdownMenuItem key={child.label} asChild>
                        <DesktopSubNav {...child} />
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href={navItem.href}>
                  <div className="group w-fit">
                    <span className="relative cursor-pointer block text-sm tracking-tight text-gray-600 dark:text-gray-200 after:block after:content-[''] after:absolute after:h-[2px] after:mt-1 after:bg-black after:dark:bg-white after:w-full after:scale-x-0 after:transition after:duration-300 after:origin-right group-hover:after:scale-x-100 group-hover:after:origin-left">
                      {navItem.label}
                    </span>
                  </div>
                </Link>
              )}
            </div>
          )
      )}
      <DarkModeSwitch />
    </div>
  );
};
