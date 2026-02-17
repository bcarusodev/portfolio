import { motion } from "framer-motion";
import { useRouter } from "next/router";
import Image from "next/image";

interface ProjectCardProps {
  id: string;
  title: string;
  topic: string;
  imgSrc: string;
}

export const ProjectCard = ({ id, title, topic, imgSrc }: ProjectCardProps) => {
  const router = useRouter();
  const handleClick = () => {
    router.push("projects/" + id);
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
      />
    </motion.div>
  );
};
