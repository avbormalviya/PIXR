import { useEffect, useRef, useState } from "react";
import style from "./input.module.scss";

export const Input = ({
    state,
    setState,
    placeholder,
    type = "text",
    icon = "",
}) => {
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const [inputType, setInputType] = useState(type);
    const [isActive, setIsActive] = useState(false);

    const isPassword = type === "password";
    const isEmail = type === "email";
    const isDate = type === "date";

    // focus logic
    const handleClick = (event) => {
        if (inputRef.current){
            inputRef.current.focus();
        }
        
        if (containerRef.current?.contains(event.target)) {
            setIsActive(true);
        } else {
            setIsActive(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    useEffect(() => {
        if (isActive && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isActive]);

    // toggle password visibility
    const toggleVisibility = () => {
        if (isPassword) {
            setInputType((prev) => (prev === "password" ? "text" : "password"));
        }
    };

    const handleCustomClick = () => {
        if (inputRef.current) {
            inputRef.current.showPicker?.(); // modern way (if supported)
            // fallback:
            inputRef.current.focus();
            inputRef.current.click(); // triggers native picker
        }
    };

    return (
        <div
            className={style.input_section}
            style={{
                boxShadow: isActive
                    ? "0 0 0 2px var(--primary-color), 0 0 0 6px #0094f624"
                    : "none",
                transition: "all 0.3s",
            }}
            ref={containerRef}
            onClick={handleClick}
        >
            <div className={style.input_wrapper}>
                <h2
                    style={{
                        color: isActive ? "var(--primary-color)" : "",
                        fontSize:
                            isActive || state?.trim().length > 0
                                ? "1.2em"
                                : "1.6em",
                        transition: "all 0.3s",
                    }}
                >
                    {placeholder}
                </h2>

                <div
                    className={style.__input_wrapper}
                    style={{
                        maxHeight:
                            isActive || state?.trim().length > 0 ? "2em" : 0,
                        transition: "all 0.3s",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <input
                            type={inputType}
                            maxLength={isPassword ? 6 : 30}
                            value={state}
                            ref={inputRef}
                            onChange={(e) => setState(e.target.value)}
                            style={{ flex: 1 }}
                        />
                    </div>
                </div>
            </div>

            {/* Password toggle icon */}
            {isPassword && (
                <i className="material-symbols-rounded" onClick={toggleVisibility}>
                    {inputType === "password" ? "visibility" : "visibility_off"}
                </i>
            )}

            {isDate && (
                <i className="material-symbols-rounded" onClick={handleCustomClick}>calendar_month</i>
            )}

            {/* Default icon if not password */}
            {!isPassword && !isDate && icon && (
                <i className="material-symbols-rounded">{icon}</i>
            )}

        </div>
    );
};
