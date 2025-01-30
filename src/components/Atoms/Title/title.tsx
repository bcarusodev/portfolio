import React from "react";

const Title = ({
  children,
  className,
}: {
  children: string;
  className?: string;
}) => (
  <p
    className={
      "mb-2 text-center text-4xl font-bold leading-[1.2] tracking-tighter text-foreground"
    }
  >
    {children}
  </p>
);

export default Title;
