"use client";
import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleBeginClick = () => {
    router.push("/civic-feed");
  };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center text-center bg-gradient-to-r from-violet-200 to-pink-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h1 className="text-8xl font-bold text-gray-900 mb-6">Civic Compass</h1>
        <p className="text-2xl text-black mb-8">
          Discover the power of AI-driven civic engagement.
        </p>
        <button
          className="mt-4 bg-white text-gray-900 border-2 border-gray-900 px-6 py-3 text-xl rounded"
          onClick={handleBeginClick}
        >
          Start Learning
        </button>
      </div>
    </motion.div>
  );
}
