"use client";
import React, { ChangeEventHandler, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, ScrollShadow, Textarea } from "@nextui-org/react";
import { motion } from "framer-motion";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import "tailwindcss/tailwind.css";

const ChatPage: React.FC = () => {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { query: string; response: string }[]
  >([]);
  const router = useRouter();

  const handleChatInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setChatInput(e.target.value);
  };

  const handleSendChat = async () => {
    if (chatInput.trim() !== "") {
      try {
        const response = await fetch(
          `https://nicholasbennet--ivyhacks-inference-web.modal.run?input=${encodeURIComponent(
            chatInput
          )}`,
          {
            headers: {
              "Content-Type": "text/event-stream",
            },
          }
        );

        const reader = response.body?.getReader();
        let receivedData = "";

        if (reader) {
          let isFinished = false;
          while (!isFinished) {
            const { done, value } = await reader.read();
            if (done) {
              isFinished = true;
            } else {
              const textDecoder = new TextDecoder();
              const decodedChunk = textDecoder.decode(value);
              receivedData += decodedChunk;
            }
          }

          setChatHistory([
            ...chatHistory,
            { query: chatInput, response: receivedData.trim() },
          ]);
          setChatInput("");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setChatHistory([
          ...chatHistory,
          {
            query: chatInput,
            response: "Error fetching data. Please try again later.",
          },
        ]);
        setChatInput("");
      }
    }
  };

  const handleBackClick = () => {
    router.push("/civic-feed");
  };

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-r from-violet-200 to-pink-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-row w-5/6 gap-5">
        <Image
          className="w-200 h-200"
          src="/candidate1.png"
          alt="candidate"
          width={200}
          height={200}
          priority={true}
        />
        <h1 className="text-8xl font-bold text-gray-900 mb-10">
          Chat with Candidate
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg w-2/3 p-3 m-3">
        <ScrollShadow className="w-full h-[400px] mb-4 overflow-y-auto">
          {chatHistory.map((item, index) => (
            <div key={index} className="mb-4">
              <p className="font-bold text-gray-800">{item.query}</p>
              <ReactMarkdown className="text-gray-600 whitespace-pre-wrap">
                {item.response}
              </ReactMarkdown>
            </div>
          ))}
        </ScrollShadow>
        <div className="flex">
          <Textarea
            placeholder="Enter your question"
            className="mr-2"
            value={chatInput}
            onChange={handleChatInputChange}
          />
          <Button
            radius="full"
            size="lg"
            className="bg-gradient-to-tr from-pink-500 to-yellow-500 text-white shadow-lg w-1/5"
            onClick={() => handleSendChat()}
          >
            Send
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

{
  /* <Button
radius="full"
color="primary"
variant="flat"
onClick={() => handleBackClick()}
>
Pick another candidate!
</Button> */
}

export default ChatPage;
