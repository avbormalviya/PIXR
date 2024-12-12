import { motion } from "framer-motion"
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';

import style from './upload.module.scss';

const MotionIcon = motion(FileUploadRoundedIcon);

export const Upload = () => {
    return (
        <section className={style.upload_section}>
            <div className={style.upload_icon_wrapper}>
            <MotionIcon
                sx={{ fontSize: 30 }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: -5 }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "reverse",
                }}
            />
            </div>
            <h1>Uploading . . . </h1>
        </section>
    )
}


