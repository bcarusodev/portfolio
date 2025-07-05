import React from "react";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const ContactButtons = () => {
  return (
    <div className={"flex justify-center"}>
      <div
        className={
          "flex flex-col justify-center self-center items-center md:flex-row md:max-w-[400px] gap-3 w-full"
        }
      >
        <Link
          href="/about"
          rel="noopener noreferrer"
          className={"w-full md:w-1/2"}
        >
          <RainbowButton className={"text-sm w-full h-10 tracking-tight"}>
            Explore My Story
          </RainbowButton>
        </Link>
        <div className={"w-full md:w-1/2"}>
          <Link href="/work" rel="noopener noreferrer">
            <Button
              variant={"outline"}
              className={
                "tracking-tight items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 group relative animate-rainbow cursor-pointer bg-[length:200%] text-foreground shadow-sm before:absolute before:bottom-[-20%] before:left-1/2 before:z-[0] before:h-[20%] before:w-[60%] before:-translate-x-1/2 inline-flex h-10 px-8 w-full gap-2 border border-input rounded-xl"
              }
            >
              Projects{" "}
              <ChevronRight
                className={
                  "w-[16px] lucide lucide-chevron-right ml-1 size-4 shrink-0 transition-all duration-300 ease-out group-hover:translate-x-1"
                }
              />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
