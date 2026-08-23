import React from "react";
import Skeleton from "@mui/material/Skeleton";
import style from "./notificationSkeleton.module.scss";

export const NotificationSkeleton = () => {
    return (
        <div className={style.notification_skeleton}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className={style.card_skeleton}>
                    <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: "var(--background-ternary)" }} />
                    <div className={style.content_skeleton}>
                        <Skeleton variant="text" width="80%" height={22} sx={{ bgcolor: "var(--background-ternary)" }} />
                        <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: "var(--background-ternary)" }} />
                    </div>
                </div>
            ))}
        </div>
    );
};
