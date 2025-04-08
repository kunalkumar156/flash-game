"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  Sun,
  RotateCcw,
  Trophy,
  Play,
  Check,
  X,
  Award,
} from "lucide-react";

// Create a 4x4 grid of game boxes (16 total)
const GAME_BOXES = Array.from({ length: 16 }, (_, index) => ({
  id: index + 1,
  color: [
    "bg-purple-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-pink-500",
    "bg-orange-500",
  ][index % 5], // Repeat colors as needed
}));

// Constants for game configuration
const MAX_LEVEL = 10;
const INITIAL_FLASH_DURATION = 700; // Duration of each box flash in ms
const INITIAL_FLASH_DELAY = 300; // Delay between flashes in ms

type GameState = "idle" | "flashing" | "userInput" | "result" | "gameOver";

interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

const GamePage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1); // Start at level 1
  const [flashingBoxes, setFlashingBoxes] = useState<number[]>([]);
  const [selectedBoxes, setSelectedBoxes] = useState<number[]>([]);
  const [activeBox, setActiveBox] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<"success" | "fail" | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([
    { name: "Mia", score: 120, date: "2025-04-07" },
    { name: "Noah", score: 90, date: "2025-04-06" },
    { name: "Emma", score: 70, date: "2025-04-05" },
  ]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [toasts, setToasts] = useState<
    {
      id: string;
      title: string;
      description: string;
      isVisible: boolean;
    }[]
  >([]);

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  // Simple toast function replacement for shadcn/ui toast
  const showToast = (title: string, description: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, isVisible: true }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  // Calculate flash duration and delay based on the current level
  const getFlashDuration = () => {
    // Gradually decrease duration as levels increase (makes game harder)
    return Math.max(300, INITIAL_FLASH_DURATION - (level - 1) * 50);
  };

  const getFlashDelay = () => {
    // Gradually decrease delay as levels increase (makes game harder)
    return Math.max(150, INITIAL_FLASH_DELAY - (level - 1) * 20);
  };

  // Generate random boxes to flash based on current level
  const generateFlashingBoxes = () => {
    const boxes = [];
    const availableBoxes = [...GAME_BOXES.map((box) => box.id)];

    // Number of boxes to flash increases with level (level 1: 3 boxes, level 2: 4 boxes, etc.)
    const numBoxesToFlash = Math.min(2 + level, 12); // Max 12 boxes at level 10

    for (let i = 0; i < numBoxesToFlash; i++) {
      const randomIndex = Math.floor(Math.random() * availableBoxes.length);
      boxes.push(availableBoxes[randomIndex]);
      availableBoxes.splice(randomIndex, 1);

      if (availableBoxes.length === 0) break;
    }

    return boxes;
  };

  // Start the game
  const startGame = () => {
    clearAllTimeouts();
    setGameState("flashing");
    setSelectedBoxes([]);
    setGameResult(null);

    const boxes = generateFlashingBoxes();
    setFlashingBoxes(boxes);

    // Flash each box one by one
    boxes.forEach((boxId, index) => {
      setTimeout(() => {
        setActiveBox(boxId);

        setTimeout(() => {
          setActiveBox(null);

          // If it's the last box, move to user input phase
          if (index === boxes.length - 1) {
            setTimeout(() => {
              setGameState("userInput");
            }, getFlashDelay());
          }
        }, getFlashDuration());
      }, index * (getFlashDuration() + getFlashDelay()));
    });
  };

  // Handle box click during user input phase
  const handleBoxClick = (boxId: number) => {
    if (gameState !== "userInput") return;

    // Prevent clicking the same box twice
    if (selectedBoxes.includes(boxId)) return;

    const newSelectedBoxes = [...selectedBoxes, boxId];
    setSelectedBoxes(newSelectedBoxes);

    // Briefly highlight the clicked box
    setActiveBox(boxId);
    setTimeout(() => setActiveBox(null), 300);

    // Check if all boxes have been selected
    if (newSelectedBoxes.length === flashingBoxes.length) {
      checkResult(newSelectedBoxes);
    }
  };

  // Check if the user's selection matches the flashing boxes (regardless of order)
  const checkResult = (selected: number[]) => {
    setGameState("result");

    // Sort both arrays to compare values regardless of order
    const sortedFlashingBoxes = [...flashingBoxes].sort();
    const sortedSelectedBoxes = [...selected].sort();

    const isCorrect = sortedFlashingBoxes.every(
      (boxId, index) => boxId === sortedSelectedBoxes[index],
    );

    if (isCorrect) {
      setGameResult("success");
      setScore((prevScore) => prevScore + 1);

      // Check if player completed the last level
      if (level === MAX_LEVEL) {
        // Game completed!
        setGameState("gameOver");
        showToast(
          "🎉 Congratulations!",
          `You've completed all ${MAX_LEVEL} levels! Final score: ${score + 1}`,
        );
      } else {
        // Progress to next level
        setLevel((prevLevel) => prevLevel + 1);
        showToast(
          "Level Complete!",
          `Moving to Level ${level + 1}. Get ready!`,
        );

        // Update high score if needed
        if (score + 1 > highScore) {
          setHighScore(score + 1);

          // Add to leaderboard if score is high enough
          const newEntry = {
            name: "You",
            score: score + 1,
            date: new Date().toISOString().split("T")[0],
          };

          const existingIndex = leaderboard.findIndex(
            (entry) => entry.name === "You",
          );

          let updatedLeaderboard = [...leaderboard];

          if (existingIndex !== -1) {
            updatedLeaderboard[existingIndex] = newEntry;
          } else {
            updatedLeaderboard.push(newEntry);
          }

          const newLeaderboard = updatedLeaderboard
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

          setLeaderboard(newLeaderboard);
        }

        // Reset game after showing result
        timerRef.current = setTimeout(() => {
          setGameState("idle");
        }, 2000);
      }
    } else {
      setGameResult("fail");

      // Reset game after showing result but stay on same level
      timerRef.current = setTimeout(() => {
        setGameState("idle");
      }, 2000);
    }
  };

  // Reset the game
  const resetGame = () => {
    clearAllTimeouts();
    setGameState("idle");
    setScore(0);
    setLevel(1);
    setFlashingBoxes([]);
    setSelectedBoxes([]);
    setActiveBox(null);
    setGameResult(null);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col p-4 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-300 text-gray-900"
      }`}
      style={{
        backgroundImage: darkMode
          ? "url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80')"
          : "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundBlendMode: "overlay",
      }}
    >
      {/* Toast messages */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-lg shadow-lg ${
                darkMode ? "bg-gray-800" : "bg-white"
              } max-w-md`}
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="font-semibold text-sm">{toast.title}</h3>
                  <p className="text-sm opacity-90">{toast.description}</p>
                </div>
                <button
                  onClick={() =>
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                  }
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <header
        className={`flex justify-between items-center mb-6 w-3/4 mx-auto ${
          darkMode ? "bg-gray-800/50" : "bg-white/50"
        } backdrop-blur-sm p-4 rounded-xl shadow-md`}
      >
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1
              className={`text-2xl font-bold ${
                darkMode ? "text-purple-300" : "text-purple-600"
              }`}
            >
              FlashGame
            </h1>
          </motion.div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${
              darkMode
                ? "bg-gray-700 text-yellow-300 hover:bg-gray-600"
                : "bg-white text-gray-700 hover:bg-gray-100"
            } transition`}
          >
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={resetGame}
            className={`p-2 rounded-full ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-white hover:bg-gray-100"
            } transition`}
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row items-center justify-center gap-12 py-10 w-full max-w-2xl mx-auto">
        <div className="w-full lg:w-1/2 space-y-8">
          {/* Game grid */}
          <div
            className={`grid grid-cols-4 gap-3 max-w-sm w-full mx-auto ${
              darkMode ? "bg-gray-800/40" : "bg-white/40"
            } backdrop-blur-sm p-6 rounded-2xl shadow-xl`}
          >
            {GAME_BOXES.map((box) => (
              <motion.div
                key={box.id}
                className={`aspect-square rounded-md cursor-pointer shadow-md ${
                  box.color
                }
          ${activeBox === box.id ? "ring-4 ring-white ring-opacity-70" : ""}
          ${
            selectedBoxes.includes(box.id) && gameState === "result"
              ? gameResult === "success"
                ? "ring-2 ring-green-500"
                : "ring-2 ring-red-500"
              : ""
          }`}
                onClick={() => handleBoxClick(box.id)}
                whileHover={gameState === "userInput" ? { scale: 1.05 } : {}}
                whileTap={gameState === "userInput" ? { scale: 0.95 } : {}}
                animate={
                  activeBox === box.id
                    ? {
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          "0px 0px 0px rgba(255,255,255,0)",
                          "0px 0px 30px rgba(255,255,255,0.8)",
                          "0px 0px 0px rgba(255,255,255,0)",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 0.5 }}
              />
            ))}
          </div>

          {/* Start / Reset Button */}
          <div className="mt-6 flex justify-center">
            {gameState === "gameOver" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 10, 0], scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Award className="h-14 w-14 text-yellow-400 drop-shadow-[0_1px_6px_rgba(0,0,0,0.2)]" />
                </motion.div>
                <h2 className="text-xl font-semibold text-yellow-400">
                  You Win!
                </h2>
                <p className="text-sm text-center text-gray-400">
                  All {MAX_LEVEL} levels cleared – {score} pts
                </p>
                <button
                  onClick={resetGame}
                  className="px-4 py-2 text-sm rounded-2xl text-white bg-purple-800/80 hover:bg-purple-600 transition-all shadow-[0_2px_10px_rgba(80,40,150,0.25)] flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Play Again
                </button>
              </motion.div>
            ) : (
              <button
                disabled={gameState !== "idle"}
                onClick={startGame}
                className={`px-4 py-2 text-sm rounded-2xl text-white transition-all shadow-[0_2px_10px_rgba(80,40,150,0.25)] flex items-center gap-2
        ${
          darkMode
            ? "bg-purple-700/80 hover:bg-purple-600"
            : "bg-purple-500/80 hover:bg-purple-400"
        }
        ${
          gameState !== "idle"
            ? "opacity-50 cursor-not-allowed"
            : "animate-bounce"
        }
      `}
              >
                <Play className="h-4 w-4" />
                {gameState === "idle" ? `Start Lv ${level}` : "Playing..."}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center">
          {/* Game stats container */}
          <div
            className={`w-full max-w-md flex flex-col items-center ${
              darkMode ? "bg-gray-800/60" : "bg-white/60"
            } backdrop-blur-sm p-4 rounded-2xl shadow-lg space-y-4`}
          >
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              {[
                { label: "Level", value: `${level}` },
                { label: "Score", value: score },
                { label: "High", value: highScore },
                { label: "Boxes", value: 2 + level },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <p className={darkMode ? "text-gray-400" : "text-gray-500"}>
                    {item.label}
                  </p>
                  <p className="text-xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {gameResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-center gap-2 text-sm"
                >
                  {gameResult === "success" ? (
                    <>
                      <Check className="text-green-500 h-5 w-5" />
                      <span className="font-medium text-green-500">
                        You got it!
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="text-red-500 h-5 w-5" />
                      <span className="font-medium text-red-500">
                        Try again.
                      </span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Leaderboard Section */}
          <div className="w-full max-w-md">
            <div
              className={`${
                darkMode ? "bg-gray-800/90" : "bg-white/90"
              } backdrop-blur-sm rounded-2xl p-4 shadow-xl border ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">Leaderboard</h2>
              </div>

              {/* Leaderboard entries */}
              <div className="mb-3 pb-3 border-b border-dashed border-gray-500/30">
                <p
                  className={`${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  } mb-2 text-xs`}
                >
                  Top Scores
                </p>
                <div className="overflow-hidden rounded-lg">
                  <div
                    className={`grid grid-cols-3 text-xs font-medium p-2 ${
                      darkMode ? "bg-gray-700/70" : "bg-gray-100/70"
                    }`}
                  >
                    <span>Name</span>
                    <span className="text-center">Score</span>
                    <span className="text-right">Date</span>
                  </div>

                  <div
                    className={`${
                      darkMode ? "bg-gray-700/40" : "bg-gray-50/40"
                    } divide-y ${
                      darkMode ? "divide-gray-600/30" : "divide-gray-200/30"
                    }`}
                  >
                    {leaderboard.map((entry, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`grid grid-cols-3 py-2 px-2 text-sm ${
                          entry.name === "You"
                            ? darkMode
                              ? "bg-gray-600/30"
                              : "bg-blue-50/50"
                            : ""
                        }`}
                      >
                        <span
                          className={`truncate ${
                            entry.name === "You" ? "font-bold" : ""
                          } ${
                            entry.name === "You"
                              ? darkMode
                                ? "text-purple-300"
                                : "text-purple-700"
                              : ""
                          }`}
                        >
                          {entry.name}
                        </span>
                        <span className="text-center">{entry.score}</span>
                        <span className="text-right text-xs opacity-70">
                          {entry.date}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Game Rules */}
              <div className="pt-1">
                <h3 className="font-semibold mb-1 text-sm">Rules:</h3>
                <ul
                  className={`text-xs space-y-1 pl-4 list-disc ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  <li>Watch flashing boxes</li>
                  <li>Click the same ones (any order)</li>
                  <li>Each level adds more</li>
                  <li>Finish all 10 levels to win</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer
        className={`mt-8 text-center text-sm ${
          darkMode
            ? "text-gray-400 bg-gray-800/30"
            : "text-gray-500 bg-white/30"
        } backdrop-blur-sm p-2 rounded-lg`}
      >
        <p>Memory Flash Game - Level up your memory skills!</p>
      </footer>
    </div>
  );
};

export default GamePage;
