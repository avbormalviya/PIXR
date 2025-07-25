import React from "react";
import style from "./chat.module.scss";

const ChatWelcomePoster = () => (
  <div className={style.welcomePoster}>
    {/* Randomized geometric mural SVG background */}
    <svg
      className={style.geoMuralBg}
      width="100%"
      height="100%"
      viewBox="0 0 1200 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      {/* Row 1 */}
      <rect x="0" y="0" width="200" height="200" fill="var(--primary-color)" opacity="0.18" />
      <circle cx="300" cy="100" r="90" fill="var(--secondary-color)" opacity="0.18" />
      <rect x="400" y="0" width="200" height="200" fill="var(--background-primary)" opacity="0.13" />
      {/* Triangle */}
      <polygon points="600,0 800,0 800,200" fill="var(--primary-color)" opacity="0.18" />
      {/* Half circle */}
      <path d="M1000,0 A100,100 0 0 1 1100,100 L1000,100 Z" fill="var(--secondary-color)" opacity="0.18" />
      {/* Stripes */}
      <g opacity="0.13">
        {[...Array(8)].map((_, i) => (
          <rect key={i} x={1020 + i * 10} y="0" width="5" height="200" fill="var(--primary-color)" />
        ))}
      </g>
      {/* Row 2 */}
      <circle cx="100" cy="300" r="90" fill="var(--secondary-color)" opacity="0.18" />
      {/* Quarter circle */}
      <path d="M200,200 A100,100 0 0 1 300,300 L200,300 Z" fill="var(--primary-color)" opacity="0.18" />
      {/* Dots pattern */}
      <g opacity="0.13">
        {[...Array(5)].map((_, i) => (
          <circle key={i} cx={420 + i * 30} cy={250 + (i % 2) * 30} r="7" fill="var(--secondary-color)" />
        ))}
      </g>
      <rect x="600" y="200" width="200" height="200" fill="var(--secondary-color)" opacity="0.18" />
      {/* Diagonal lines */}
      <g opacity="0.13">
        {[...Array(7)].map((_, i) => (
          <line key={i} x1={820 + i * 20} y1="200" x2={800 + i * 20} y2="400" stroke="var(--primary-color)" strokeWidth="6" />
        ))}
      </g>
      <circle cx="1100" cy="300" r="90" fill="var(--primary-color)" opacity="0.13" />
      {/* Row 3 */}
      <rect x="0" y="400" width="200" height="200" fill="var(--secondary-color)" opacity="0.13" />
      {/* Arc */}
      <path d="M200,400 A100,100 0 0 1 400,600" stroke="var(--primary-color)" strokeWidth="18" fill="none" opacity="0.13" />
      <circle cx="500" cy="500" r="90" fill="var(--background-primary)" opacity="0.18" />
      {/* Triangle */}
      <polygon points="600,400 800,600 800,400" fill="var(--secondary-color)" opacity="0.18" />
      {/* Dots pattern */}
      <g opacity="0.13">
        {[...Array(5)].map((_, i) => (
          <circle key={i} cx={820 + i * 30} cy={450 + (i % 2) * 30} r="7" fill="var(--primary-color)" />
        ))}
      </g>
      <rect x="1000" y="400" width="200" height="200" fill="var(--secondary-color)" opacity="0.18" />
      {/* Row 4 */}
      {/* Half circle */}
      <path d="M0,600 A100,100 0 0 0 100,700 L0,700 Z" fill="var(--primary-color)" opacity="0.18" />
      <rect x="200" y="600" width="200" height="200" fill="var(--background-primary)" opacity="0.18" />
      {/* Quarter circle */}
      <path d="M400,600 A100,100 0 0 0 500,700 L400,700 Z" fill="var(--secondary-color)" opacity="0.18" />
      <circle cx="700" cy="700" r="90" fill="var(--primary-color)" opacity="0.18" />
      {/* Stripes */}
      <g opacity="0.13">
        {[...Array(8)].map((_, i) => (
          <rect key={i} x={820 + i * 10} y="600" width="5" height="200" fill="var(--secondary-color)" />
        ))}
      </g>
      <rect x="1000" y="600" width="200" height="200" fill="var(--primary-color)" opacity="0.13" />
      {/* Decorative arcs */}
      <path d="M0,0 Q600,400 1200,0" stroke="var(--primary-color)" strokeWidth="20" opacity="0.08" fill="none" />
      <path d="M0,800 Q600,400 1200,800" stroke="var(--secondary-color)" strokeWidth="20" opacity="0.08" fill="none" />
    </svg>
    {/* Centered text */}
    <div className={style.centerText}>
      <div className={style.pixrLogo}>PIXR</div>
      <div className={style.welcomeTitle}>Welcome to PIXR Chat</div>
      <div className={style.welcomeSubtext}>Connect, share, and chat with your friends in a modern, secure space.</div>
    </div>
  </div>
);

export default ChatWelcomePoster;
