import style from "./userPPic.module.scss";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Img } from "../img/Img";

const HollowArc = ({ percentage = 0, isGradient = false, radius = 50, strokeWidth = 2.5 }) => {
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const gradientId = isGradient ? "gradient1" : "gradient2";

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${radius * 2 + strokeWidth} ${radius * 2 + strokeWidth}`} >
      {/* Gradient Definition */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
          {/* <stop offset="0%" stopColor="#1e90ff" />
          <stop offset="100%" stopColor="#00bfff" /> */}
          <stop offset="0%" stopColor="#f402f1" />
          <stop offset="100%" stopColor="#62cff4" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="100%" stopColor="var(--background-ternary)" />
        </linearGradient>
      </defs>
      <circle
        cx={radius + strokeWidth / 2}
        cy={radius + strokeWidth / 2}
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
};



export const UserPPic = ({
  heightBase = true,
  userName,
  profilePic,
  isRing = true,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className={style.imageHolder}
      style={{
        aspectRatio: heightBase ? "1 / 1" : "unset",
        width: heightBase ? "unset" : "100%",
        position: "relative",
      }}
      onClick={() => navigate(`/memoir/${userName}`)}
    >
      <HollowArc percentage={100} isGradient={isRing} />
      <Img
        url={profilePic}
        alt="profile-pic"
      />
    </div>
  );
};
