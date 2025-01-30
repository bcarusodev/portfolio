import { ReactNode } from "react";
import { VisuallyHidden } from "@chakra-ui/react";

export const SocialIcon = ({
  children,
  label,
  href,
}: {
  children: ReactNode;
  label: string;
  href: string;
}) => {
  return (
    // TODO: Review theming
    <a
      className={
        "inline-flex pointer items-center justify-center " +
        "rounded-xl text-sm font-medium transition-colors " +
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring " +
        "disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground " +
        "h-9 py-2 w-9 px-0"
      }
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </a>
  );
};
