import { useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { showError } from "../../../utils/toast";

// Watches Redux globalError state and sends errors to the toast system
export const Error = () => {
    const { error } = useSelector((state) => state.globalError);
    const lastErrorRef = useRef(null);

    useEffect(() => {
        if (error && error.data?.message) {
            // Avoid showing the same error twice in a row
            const msg = error.data.message;
            if (msg !== lastErrorRef.current) {
                lastErrorRef.current = msg;
                showError(msg);
                // Reset after a bit so same error can show again later
                setTimeout(() => { lastErrorRef.current = null; }, 6000);
            }
        }
    }, [error]);

    return null;
};
