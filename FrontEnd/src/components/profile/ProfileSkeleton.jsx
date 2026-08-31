import React from "react";
import Skeleton from "@mui/material/Skeleton";
import style from "./profileSkeleton.module.scss";

export const ProfileSkeleton = () => {
    return (
        <section className={style.profile_skeleton}>
            <div className={style.about_skeleton}>
                <div className={style.header_skeleton}>
                    <Skeleton variant="text" width={140} height={32} sx={{ bgcolor: "var(--background-ternary)" }} />
                </div>

                <div className={style.main_skeleton}>
                    <Skeleton variant="circular" width={90} height={90} sx={{ bgcolor: "var(--background-ternary)" }} />
                    <div className={style.info_skeleton}>
                        <Skeleton variant="text" width={160} height={28} sx={{ bgcolor: "var(--background-ternary)" }} />
                        <Skeleton variant="text" width={100} height={20} sx={{ bgcolor: "var(--background-ternary)" }} />
                    </div>

                    <div className={style.stats_skeleton}>
                        <div className={style.stat_item}>
                            <Skeleton variant="text" width={30} height={24} sx={{ bgcolor: "var(--background-ternary)" }} />
                            <Skeleton variant="text" width={50} height={16} sx={{ bgcolor: "var(--background-ternary)" }} />
                        </div>
                        <div className={style.stat_item}>
                            <Skeleton variant="text" width={30} height={24} sx={{ bgcolor: "var(--background-ternary)" }} />
                            <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: "var(--background-ternary)" }} />
                        </div>
                        <div className={style.stat_item}>
                            <Skeleton variant="text" width={30} height={24} sx={{ bgcolor: "var(--background-ternary)" }} />
                            <Skeleton variant="text" width={60} height={16} sx={{ bgcolor: "var(--background-ternary)" }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className={style.grid_skeleton}>
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <Skeleton
                        key={idx}
                        variant="rounded"
                        className={style.grid_item_skeleton}
                        sx={{ bgcolor: "var(--background-ternary)", borderRadius: "12px" }}
                    />
                ))}
            </div>
        </section>
    );
};
