import style from './initialLoading.module.scss';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0.3 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: "mirror",
    },
  },
};

const InitialLoading = () => {
  const logo = ['P', 'I', 'X', 'R']; // Sexy branding

  return (
    <motion.div
      className={style.container}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {logo.map((char, index) => (
        <motion.span key={index} className={style.logo_Text} variants={itemVariants}>
          {char}
        </motion.span>
      ))}
      <span className={style.subtitle}>Powered By Pixr</span>
    </motion.div>
  );
};

export { InitialLoading };
