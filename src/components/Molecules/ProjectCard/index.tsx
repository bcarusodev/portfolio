import { Card, CardHeader, Heading, Text, Link } from "@chakra-ui/react";
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
          loading="eager"
        ></Image>
      </Card>
    </motion.div>
  );
};
