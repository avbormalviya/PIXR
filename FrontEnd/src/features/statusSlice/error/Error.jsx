import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import style from "./error.module.scss";

import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';

export const Error = () => {
    const navigate = useNavigate();

    const { error } = useSelector(state => state.globalError);

    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (error && error.data?.message) {
            navigate(-1);
            setIsError(true);

            const timer = setTimeout(() => {
                setIsError(false);
            }, 5000);

            return () => clearTimeout(timer);
        } else {
            setIsError(false);
        }
    }, [error]);

    return (
        <AnimatePresence>
            {
                isError && (
                    <motion.div
                        className={style.error}
                        initial={{ x: '120%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '120%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                    >
                        <ErrorOutlineRoundedIcon fontSize="large" />{error?.data?.message}
                    </motion.div>
                )
            }
        </AnimatePresence>
    );
};
