import { ReactElement } from "react";

interface FeatureProps {
  title: string;
  text: string;
  icon: ReactElement;
}

export default function ServiceCard({ title, text, icon }: FeatureProps) {
  return (
    <div className="group/card relative flex flex-col w-full h-[170px] cursor-pointer px-6 py-5 md:w-[370px] md:h-[200px] rounded-xl border border-border/100 bg-accent/40 dark:bg-card/80 backdrop-blur-2xl text-card-foreground overflow-hidden transition-all duration-300 hover:border-muted-foreground/40 hover:shadow-lg hover:shadow-primary/5">
      {/* Blurry ambient glow */}
      <div className="pointer-events-none absolute -top-12 -left-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 opacity-0 group-hover/card:opacity-100" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-accent/15 blur-3xl transition-opacity duration-500 opacity-0 group-hover/card:opacity-100" />

      <div className="relative flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg border bg-accent/80 text-foreground transition-colors duration-300 group-hover/card:bg-primary group-hover/card:text-primary-foreground">
          {icon}
        </div>
        <span className="font-semibold text-foreground tracking-tight text-[15px]">
          {title}
        </span>
      </div>
      <div className="relative w-8 h-px bg-border mb-3 transition-all duration-300 group-hover/card:w-12 group-hover/card:bg-primary" />
      <p className="relative text-muted-foreground text-sm leading-relaxed">
        {text}
      </p>
    </div>
  );
}
