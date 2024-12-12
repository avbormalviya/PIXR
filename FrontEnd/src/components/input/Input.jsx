import { useEffect, useRef, useState } from "react"
import style from "./Input.module.scss"

export const Input = ({ state, setState, placeholder, icon }) => {
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    const [isActive, setIsActive] = useState(false);

    const handleClick = (event) => {
        if (containerRef.current && containerRef.current.contains(event.target)) {
            setIsActive(true);
        } else {
            setIsActive(false);
        }
    };

    useEffect(() => {
        setTimeout(() => {
            if (isActive && inputRef.current) {
                inputRef.current.focus();
            }
        }, 10);
    }, [isActive])

    useEffect(() => {
        document.addEventListener('mousedown', handleClick);
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, []);

    return (
        <div 
            className={style.input_section}
            style={{
                boxShadow: isActive ? "0 0 0 2px var(--primary-color), 0 0 0 6px #0094f624" : "none",
                transition: "all 0.3s"
            }}
            ref={containerRef}
        >
            <div className={style.input_wrapper}>
                <h2 
                    style={{
                        color: isActive ? "var(--primary-color)" : "",
                        fontSize: isActive || state?.trim().length > 0 ? "1.2em" : "1.6em",
                        transition: "all 0.3s"
                    }}
                >
                    { placeholder }
                </h2>
                <div
                    className={style.__input_wrapper}
                    style={{
                        maxHeight: isActive || state?.trim().length > 0 ? "2em" : 0,
                        transition: "all 0.3s"
                    }}
                >
                    <input
                        type="text"
                        name="" id=""
                        ref={inputRef}
                        onChange={(e) => setState(e.target.value)}
                    />
                </div>
            </div>
            <i className="material-symbols-rounded">{ icon }</i>
        </div>
    )
}