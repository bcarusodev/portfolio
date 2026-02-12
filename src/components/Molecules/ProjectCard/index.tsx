import { Card, CardHeader, Heading, Text, Link } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import Image from "next/image";
import useNextBlurhash from "use-next-blurhash";

interface ProjectCardProps {
  id: string;
  title: string;
  topic: string;
  imgSrc: string;
  blurhash?: string;
}

export const ProjectCard = ({
  id,
  title,
  topic,
  imgSrc,
  blurhash,
}: ProjectCardProps) => {
  const router = useRouter();
  const [blurDataUrl] = useNextBlurhash(
    blurhash || "LEHV6nWB2yk8pyo0adR*.7kCMdnj"
  );
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{
        scale: 0.99,
      }}
    >
      <Card
        w={300}
        h={300}
        borderRadius={15}
        as={Link}
        href={"projects/" + id}
        onClick={(e) => {
          e.preventDefault();
          router.push("projects/" + id);
        }}
      >
        <CardHeader position="absolute" zIndex={2}>
          <Text
            fontSize={12}
            fontWeight="bold"
            textTransform="uppercase"
            color="#ffffffAA"
          >
            {topic}
          </Text>
          <Heading size="lg" color="white" className={"tracking-tight"}>
            {title}
          </Heading>
        </CardHeader>
        <Image
          alt={title}
          width={600}
          height={600}
          className={"rounded-xl object-cover w-full h-full"}
          src={"/" + imgSrc}
          placeholder="blur"
          blurDataURL={blurDataUrl}
          loading="eager"
        ></Image>
      </Card>
    </motion.div>
  );
};
