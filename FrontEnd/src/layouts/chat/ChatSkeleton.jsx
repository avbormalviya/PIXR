import React from "react";
import Skeleton from "@mui/material/Skeleton";
import style from "./chatSkeleton.module.scss";

export const ChatSkeleton = () => {
    return (
        <div className={style.chat_skeleton_wrapper}>
            <div className={style.sidebar_skeleton}>
                <div className={style.search_skeleton}>
                    <Skeleton variant="rounded" width="100%" height={38} sx={{ bgcolor: "var(--background-ternary)", borderRadius: "10px" }} />
                </div>
                <div className={style.list_skeleton}>
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div key={item} className={style.item_skeleton}>
                            <Skeleton variant="circular" width={44} height={44} sx={{ bgcolor: "var(--background-ternary)" }} />
                            <div className={style.text_skeleton}>
                                <Skeleton variant="text" width="65%" height={20} sx={{ bgcolor: "var(--background-ternary)" }} />
                                <Skeleton variant="text" width="45%" height={16} sx={{ bgcolor: "var(--background-ternary)" }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={style.main_chat_skeleton}>
                <div className={style.chat_header_skeleton}>
                    <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: "var(--background-ternary)" }} />
                    <Skeleton variant="text" width={140} height={24} sx={{ bgcolor: "var(--background-ternary)" }} />
                </div>
                <div className={style.messages_skeleton}>
                    <Skeleton variant="rounded" width="55%" height={48} sx={{ bgcolor: "var(--background-ternary)", alignSelf: "flex-start", borderRadius: "18px" }} />
                    <Skeleton variant="rounded" width="45%" height={48} sx={{ bgcolor: "var(--background-ternary)", alignSelf: "flex-end", borderRadius: "18px" }} />
                    <Skeleton variant="rounded" width="60%" height={56} sx={{ bgcolor: "var(--background-ternary)", alignSelf: "flex-start", borderRadius: "18px" }} />
                    <Skeleton variant="rounded" width="40%" height={48} sx={{ bgcolor: "var(--background-ternary)", alignSelf: "flex-end", borderRadius: "18px" }} />
                </div>
            </div>
        </div>
    );
};
