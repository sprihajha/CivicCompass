"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  Chip,
  CardFooter,
  Divider,
  Link,
  Button,
} from "@nextui-org/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const CandidateCard: React.FC<{
  name: string;
  age: number;
  party: string;
  imageUrl: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ name, age, party, imageUrl, isSelected, onClick }) => {
  const router = useRouter();

  const handleChatClick = () => {
    router.push(`/chat`);
  };

  return (
    <motion.div
      className={`${isSelected ? "scale-110" : "scale-90"} flex flex-row`}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
    >
      <Image
        src={imageUrl}
        alt={name}
        className="w-500 h-500"
        width={500}
        height={500}
      />
      <Card
        className="border-none bg-background/60 max-w-[220px] -ml-[250px] max-h-[125px]"
        isBlurred
      >
        <CardHeader className="flex justify-center">
          <div className="flex flex-row gap-2">
            <p className="text-md">{name}</p>
            <Chip color={`${party == "Democrat" ? "primary" : "danger"}`}>
              {party}
            </Chip>
          </div>
        </CardHeader>
        <Divider />
        <CardFooter className="flex justify-center">
          <Button
            radius="full"
            color="primary"
            variant="flat"
            onClick={() => handleChatClick()}
          >
            Chat with me!
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default CandidateCard;
