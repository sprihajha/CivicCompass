"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import "tailwindcss/tailwind.css";
import CandidateCard from "@/components/CandidateCard";

const CivicFeed: React.FC = () => {
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(
    null
  );

  const handleCandidateClick = (candidateNumber: number) => {
    setSelectedCandidate(candidateNumber);
  };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center text-center bg-gradient-to-r from-violet-200 to-pink-200"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h1 className="text-8xl font-bold text-gray-900 mb-10">
          Meet the Candidates
        </h1>
        <div className="grid grid-cols-2">
          <CandidateCard
            name="Candidate 1"
            age={45}
            party="Democrat"
            imageUrl="/candidate1.png"
            isSelected={selectedCandidate === 1}
            onClick={() => handleCandidateClick(1)}
          />
          <CandidateCard
            name="Candidate 2"
            age={52}
            party="Republican"
            imageUrl="/candidate2.png"
            isSelected={selectedCandidate === 2}
            onClick={() => handleCandidateClick(2)}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default CivicFeed;
