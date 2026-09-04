import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import style from "./loader.module.scss";

export const Loader = () => {
    const { isLoading } = useSelector((state) => state.globalLoader);
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const intervalRef = useRef(null);
    const hideTimer = useRef(null);

    useEffect(() => {
        if (isLoading) {
            setVisible(true);
            setProgress(0);
            clearInterval(intervalRef.current);
            clearTimeout(hideTimer.current);

            // Quickly go to ~80%, then slow down (simulate indeterminate)
            intervalRef.current = setInterval(() => {
                setProgress((p) => {
                    if (p < 60) return p + 8;
                    if (p < 80) return p + 2;
                    if (p < 92) return p + 0.5;
                    return p;
                });
            }, 120);
        } else {
            clearInterval(intervalRef.current);
            setProgress(100);
            hideTimer.current = setTimeout(() => {
                setVisible(false);
                setProgress(0);
            }, 350);
        }

        return () => {
            clearInterval(intervalRef.current);
            clearTimeout(hideTimer.current);
        };
    }, [isLoading]);

    if (!visible) return null;

    return (
        <div className={style.progress_bar_track}>
            <div
                className={style.progress_bar_fill}
                style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
            />
        </div>
    );
};
