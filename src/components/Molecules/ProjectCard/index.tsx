import { Card, CardHeader, Heading, Text, Image } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";

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
        onClick={() => router.push("projects/" + id)}
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
          <Heading size="lg" color="white">
            {title}
          </Heading>
        </CardHeader>
        <Image
          borderRadius={15}
          w="full"
          h="full"
          objectFit={"cover"}
          src={imgSrc}
          priority
        ></Image>
      </Card>
    </motion.div>
  );
};
