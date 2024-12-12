import style from "./fileInput.module.scss";

export const FileInput = ({ profilePic, setProfilePic }) => {

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        
        if (selectedFile) {
            setProfilePic({ src: URL.createObjectURL(selectedFile), file: selectedFile });
        }
    };

    return (
        <>
            <label className={style.file_input} htmlFor="fileInput">
                <img src={ profilePic.src } alt="" />
                <i className="material-symbols-rounded">photo_camera</i>
            </label>
            
            <input onChange={ handleFileChange } type="file" id="fileInput" />

        </>
    )
}
