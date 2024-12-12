import { useSelector } from "react-redux"

import style from "./loader.module.scss"

import { motion } from "framer-motion"

export const Loader = () => {

    const { isLoading } = useSelector(state => state.globalLoader)

    if (isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className={style.loader_holder}
            >
                <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} width="80" height="80" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <style>{`.spinner_9y7u{animation:spinner_fUkk 2.4s linear infinite;animation-delay:-2.4s}.spinner_DF2s{animation-delay:-1.6s}.spinner_q27e{animation-delay:-.8s}@keyframes spinner_fUkk{8.33%{x:13px;y:1px}25%{x:13px;y:1px}33.3%{x:13px;y:13px}50%{x:13px;y:13px}58.33%{x:1px;y:13px}75%{x:1px;y:13px}83.33%{x:1px;y:1px}}`}</style>
                    <rect className="spinner_9y7u" x="1" y="1" rx="1" width="10" height="10" fill="#0095f6" />
                    <rect className="spinner_9y7u spinner_DF2s" x="1" y="1" rx="1" width="10" height="10" fill="#0095f6" />
                    <rect className="spinner_9y7u spinner_q27e" x="1" y="1" rx="1" width="10" height="10" fill="#0095f6" />
                </motion.svg>
    
            </motion.div>
        )
    }
}