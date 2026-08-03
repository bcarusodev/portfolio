import Image from "next/image";

export const Me = () => {
  return (
    <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-5">
      <div className="flex flex-col gap-8">
        <div>
          <h2 className="text-3xl font-bold">Hi, I{"'"}m Bruno 👋</h2>
          <span className="inline-block max-w-[600px] md:text-xl">
            Full Stack Engineer
          </span>
        </div>
        <div className="max-w-full">
          <p className="prose text-pretty font-sans text-sm text-muted-foreground dark:prose-invert">
            I started development in 2017 when I created{" "}
            <a
              href="https://web.archive.org/web/20170109042450/http://www.mtalpm.com/"
              className="underline"
            >
              my first game server using Lua scripting
            </a>
            . In 2019, driven by curiosity, I began learning on my own through
            Udemy and YouTube. Then, in 2020, I started my professional career.
            Now, with four years of experience in various projects (fintech,
            ad-tech, ERP, B2B, B2C), I love working with React, Next.js, and
            Node.js. I{"'"}m open to other frameworks and languages and have a
            strong interest in crypto- and fintech-related industries.
          </p>
        </div>
      </div>

      <Image
        width={150}
        height={150}
        className="object-cover rounded-full shadow-2xl aspect-square"
        loading="eager"
        // @ts-ignore
        style={{ objectViewBox: "inset(0% -16% 21% 0%)" }}
        src="/assets/images/hero.jpg"
        alt="Me"
      />
    </div>
  );
};
