import style from './initialLoading.module.scss';
import { motion } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            duration: 5,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0.3 },
    visible: { 
        opacity: 1, 
        transition: { 
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            yoyo: true,
            repeatDelay: 0.5
        } 
    },
};

const InitialLoading = () => {
    return (
        <motion.div
            className={style.container}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.span className={style.logo_Text} variants={itemVariants}>P</motion.span>
            <motion.span className={style.logo_Text} variants={itemVariants}>I</motion.span>
            <motion.span className={style.logo_Text} variants={itemVariants}>X</motion.span>
            <motion.span className={style.logo_Text} variants={itemVariants}>R</motion.span>
        </motion.div>
    );
};

export { InitialLoading };
