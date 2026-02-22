import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/router";
import { decode } from "blurhash";
import { useMemo, useState } from "react";

interface ProjectCardProps {
  id: string;
  title: string;
  topic: string;
  imgSrc: string;
  blurhash?: string;
}

const createBlurDataURL = (hash?: string, width = 32, height = 32) => {
  if (!hash || typeof window === "undefined") {
    return undefined;
  }

  try {
    const pixels = decode(hash, width, height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      return undefined;
    }

    const imageData = context.createImageData(width, height);
    imageData.data.set(pixels);
    context.putImageData(imageData, 0, 0);

    return canvas.toDataURL();
  } catch (error) {
    return undefined;
  }
};

export const ProjectCard = ({
  id,
  title,
  topic,
  imgSrc,
  blurhash,
}: ProjectCardProps) => {
  const router = useRouter();
  const blurDataURL = useMemo(() => createBlurDataURL(blurhash), [blurhash]);
  const [isLoaded, setIsLoaded] = useState(false);
  const handleClick = () => {
    router.push("work/" + id);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{
        scale: 0.99,
      }}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
      className="relative w-[300px] h-[300px] rounded-[15px] overflow-hidden"
    >
      <div className="absolute top-0 left-0 z-10 p-5">
        <span className="text-[0.7rem] font-bold uppercase text-white/70">
          {topic}
        </span>
        <h3 className="text-2xl font-bold text-white tracking-tight antialiased">
          {title}
        </h3>
      </div>
      <Image
        alt={title}
        width={600}
        height={600}
        className="rounded-xl object-cover w-full h-full"
        src={"/" + imgSrc}
        loading="eager"
        placeholder={blurDataURL ? "blur" : "empty"}
        blurDataURL={blurDataURL}
        onLoadingComplete={() => setIsLoaded(true)}
      />
      {blurDataURL ? (
        <div
          className={`absolute inset-0 z-0 transition-opacity duration-500 ease-out pointer-events-none ${
            isLoaded ? "opacity-0" : "opacity-100"
          }`}
          style={{
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : null}
    </motion.div>
  );
};
