import { useRef, useState } from "react";

export const useFileInput = ({
    accept = "*",
    multiple = false,
    onChange: customOnChange = () => {},
} = {}) => {
    const inputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);

    const trigger = () => {
        inputRef.current?.click();
    };

    const handleChange = (e) => {
        const selected = Array.from(e.target.files || []);
        setFiles(selected);
        setPreviews(
            selected.map((file) =>
                file.type.startsWith("image/") ? URL.createObjectURL(file) : null
            )
        );

        // 💡 Call your custom logic too
        customOnChange(selected, e);
    };

    const reset = () => {
        setFiles([]);
        setPreviews([]);
        if (inputRef.current) inputRef.current.value = null;
    };

    return {
        files,
        previews,
        trigger,
        reset,
        inputProps: {
            ref: inputRef,
            type: "file",
            accept,
            multiple,
            onChange: handleChange,
            style: { display: "none" },
        },
    };
};
