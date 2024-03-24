// components/PuzzlePiece.tsx
import { motion } from "framer-motion";

interface PuzzlePieceProps {
  image: string;
  initialPosition: { x: number; y: number };
  size: { width: number; height: number };
  beginButtonPosition: { x: number; y: number };
  heading: string;
  isEven: boolean;
}

const PuzzlePiece: React.FC<PuzzlePieceProps> = ({
  image,
  initialPosition,
  size,
  beginButtonPosition,
  heading,
  isEven,
}) => {
  return (
    <motion.div
      className="absolute bg-cover bg-center"
      style={{
        width: size.width,
        height: size.height,
        backgroundImage: `url(${image})`,
        left: beginButtonPosition.x - size.width / 2,
        top: beginButtonPosition.y - size.height,
      }}
      animate={{
        x: [
          beginButtonPosition.x - size.width / 2,
          isEven
            ? beginButtonPosition.x - size.width / 2 - window.innerWidth / 2
            : beginButtonPosition.x - size.width / 2 + window.innerWidth / 2,
        ],
        scale: 1,
        opacity: [1, 0],
      }}
      transition={{
        duration: 3,
        ease: "linear",
      }}
    />
  );
};

export default PuzzlePiece;
