"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const boxCount = 9;

export default function Page() {
  const [flashedBoxes, setFlashedBoxes] = useState<number[]>([]);
  const [userSelection, setUserSelection] = useState<number[]>([]);
  const [isFlashing, setIsFlashing] = useState(false);
  const [showMessage, setShowMessage] = useState("");
  const [activeBox, setActiveBox] = useState<number | null>(null);

  const flashSequence = async () => {
    setShowMessage("");
    setUserSelection([]);
    const count = Math.floor(Math.random() * 3) + 2;
    const indexes: number[] = [];
    while (indexes.length < count) {
      const randomIndex = Math.floor(Math.random() * boxCount);
      if (!indexes.includes(randomIndex)) indexes.push(randomIndex);
    }

    setIsFlashing(true);
    for (let i = 0; i < indexes.length; i++) {
      setActiveBox(indexes[i]);
      await new Promise((res) => setTimeout(res, 600));
      setActiveBox(null);
      await new Promise((res) => setTimeout(res, 200));
    }
    setFlashedBoxes(indexes);
    setIsFlashing(false);
  };

  const handleClick = (index: number) => {
    if (isFlashing || userSelection.includes(index)) return;
    const newSelection = [...userSelection, index];
    setUserSelection(newSelection);

    if (newSelection.length === flashedBoxes.length) {
      const correct =
        [...newSelection].sort().join(",") ===
        [...flashedBoxes].sort().join(",");
      setShowMessage(correct ? "🎉 You got it!" : "❌ Oops, try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#bebebe] to-[#b6d4e3] flex flex-col items-center justify-center px-4">
      <motion.h1
        className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Memory Flash Game
      </motion.h1>

      <div className="grid grid-cols-3 gap-4">
        {[...Array(boxCount)].map((_, i) => {
          let boxClasses =
            "w-20 h-20 md:w-24 md:h-24 rounded-xl border cursor-pointer flex items-center justify-center transition-all ";

          if (activeBox === i) {
            boxClasses += "bg-blue-400 ";
          } else if (userSelection.includes(i) && flashedBoxes.includes(i)) {
            boxClasses += "bg-green-300 ";
          } else if (userSelection.includes(i) && !flashedBoxes.includes(i)) {
            boxClasses += "bg-red-300 ";
          } else {
            boxClasses += "bg-white hover:bg-blue-100 ";
          }

          if (isFlashing) {
            boxClasses += "pointer-events-none ";
          }

          return (
            <motion.div
              key={i}
              className={boxClasses}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleClick(i)}
            />
          );
        })}
      </div>

      <motion.button
        onClick={flashSequence}
        className="mt-10 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition"
        whileTap={{ scale: 0.95 }}
        disabled={isFlashing}
      >
        {isFlashing ? "Flashing..." : "Start"}
      </motion.button>

      {showMessage && (
        <motion.p
          className="mt-6 text-lg font-semibold text-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {showMessage}
        </motion.p>
      )}
    </div>
  );
}
