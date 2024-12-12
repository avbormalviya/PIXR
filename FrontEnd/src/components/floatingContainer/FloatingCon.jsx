import style from "./floatingCon.module.scss";
import { motion } from "framer-motion";

export const FloatingCon = ({ children, darkColor }) => {
    return (
        <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={style.floating_con}
            style={{
                backgroundColor: darkColor ? "var(--background-primary)" : null,
            }}
        >
            {children}
        </motion.section>
    );
};
