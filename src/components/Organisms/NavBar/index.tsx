import { useState } from "react";
import { DesktopNav } from "../../Molecules/DesktopNav";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Atoms/Brand";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { NAV_ITEMS } from "@data/NavItems";
import { MobileNavItem } from "@/components/Atoms/MobileNavItem";
import { Menu } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full bg-transparent backdrop-blur-xs md:backdrop-blur-0 border-b md:border-b-0 pt-2 md:pt-8">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex min-h-[60px] py-2 px-4 items-center">
          <div className="flex flex-1 justify-between items-center">
            <BlurFade>
              <Brand className="ml-2" />
            </BlurFade>

            <BlurFade>
              <div className="hidden md:flex">
                <DesktopNav />
              </div>
            </BlurFade>
          </div>

          <div className="flex flex-auto flex-end md:hidden justify-end">
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
              <DrawerTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Menu className="w-5 h-5" />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div
                  className="overflow-auto p-6 space-y-2"
                  onClick={() => setIsOpen(false)}
                >
                  {NAV_ITEMS.map(
                    (navItem) =>
                      navItem.enabled && (
                        <MobileNavItem key={navItem.label} {...navItem} />
                      )
                  )}
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>
    </header>
  );
}
