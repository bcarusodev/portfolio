import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <motion.div
      className="fixed inset-0 -z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: "easeInOut" }}
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-white dark:from-slate-800/50 dark:to-black" />
      {/* Side shadows */}
      <div className="absolute inset-0 opacity-85 bg-gradient-to-r from-gray-50 via-transparent to-gray-50 dark:from-black/90 dark:via-transparent dark:to-black/100" />

      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden mix-blend-soft-light opacity-90 md:opacity-50 dark:opacity-80">
        <motion.div
          className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%]"
          animate={{ rotate: 360 }}
          transition={{
            duration: 350,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        >
          <svg
            className="absolute w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
              <pattern
                id="circles"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="40"
                  cy="40"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <rect width="100%" height="100%" fill="url(#circles)" />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
}
