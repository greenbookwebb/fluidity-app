import { AnimatePresence, motion } from "framer-motion";
import { ReactElement, useState } from "react";
import { Card, CaretLeft, CaretRight, Text } from "~/components/";
import { ICard } from "../Card/Card";

import styles from "./CardCarousel.module.scss";

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 350 : -350,
      opacity: 0,
    };
  },
  center: {
    zIndex: 0,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 350 : -350,
      opacity: 0,
    };
  },
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

interface ISlide {
  children: React.ReactNode;
  className?: string;
}

const Slide: React.FC<ISlide> = ({ className = "", children }) => {
  const classes = `${styles.SlideContent} ${className}`;
  return <div className={classes}>{children}</div>;
};

interface ICardCarousel extends ICard {
  children: ReactElement<ISlide>[];
  size?: "compact" | "normal";
}

const CardCarousel: React.FC<ICardCarousel> = ({
  children,
  type = "box",
  rounded = true,
  size = "normal",
  ...props
}) => {
  const slides = children.length;
  const isCompact = size === "compact";

  const [[slide, direction], setSlide] = useState([0, 0]);

  const paginate = (dir: number) => {
    setSlide(([slide, direction]) => [
      slide + dir < slides && slide + dir >= 0
        ? slide + dir
        : dir === 1
          ? 0
          : slides - 1,
      dir,
    ]);
  };

  if (slides < 2) return null;

  const Navigation = () => (
    <>
      <div
        className={`${!isCompact ? styles.arrow : ""} ${styles[type]}`}
        onClick={() => {
          paginate(-1);
        }}
      >
        <CaretLeft />
      </div>
      <div className={styles.navbar}>
        {children.map((_, i) => (
          <div
            key={i}
            className={`${slide === i ? styles.active : ""} ${styles.dot}`}
            onClick={() => {
              setSlide([i, i > slide ? 1 : -1]);
            }}
          />
        ))}
      </div>
      <div
        className={`${!isCompact ? styles.arrow : ""} ${styles[type]}`}
        onClick={() => {
          paginate(1);
        }}
      >
        <CaretRight />
      </div>
    </>
  );

  return (
    <Card
      {...props}
      type={type}
      rounded={rounded}
      className={`${styles.CardCarousel} ${styles[size]}`}
    >
      <div className={styles.content}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            className={styles.slide}
            key={`card-carousel-${slide}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 350, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
          >
            {children[slide]}
          </motion.div>
        </AnimatePresence>
      </div>
      {isCompact ? (
        <div className={`${styles.bottomNavbar} ${styles[type]}`}>
          <Navigation />
        </div>
      ) : (
        <Navigation />
      )}
    </Card>
  );
};

export default Object.assign(CardCarousel, { Slide });
