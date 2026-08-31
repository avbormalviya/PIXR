import React from "react";
import style from "./chat.module.scss";

const ChatWelcomePoster = () => (
  <div className={style.welcomePoster}>
    {/* Dark Glassmorphic Ambient Mesh */}
    <div className={style.glassMeshBg}>
      <div className={style.glowBlob1} />
      <div className={style.glowBlob2} />
    </div>

    {/* Centered Futuristic Glass Content Card */}
    <div className={style.centerText}>
      <div className={style.chatIconBadge}>
        <i className="material-symbols-rounded">forum</i>
      </div>

      <div className={style.pixrLogo}>PIXR</div>
      <div className={style.welcomeTitle}>Connect on PIXR Chat</div>
      <div className={style.welcomeSubtext}>
        Select a conversation from the left to start messaging, sharing media, or making video calls.
      </div>

      {/* Feature Badges */}
      <div className={style.featureBadges}>
        <span className={style.badge}>
          <i className="material-symbols-rounded">lock</i> Encrypted
        </span>
        <span className={style.badge}>
          <i className="material-symbols-rounded">videocam</i> HD Video
        </span>
        <span className={style.badge}>
          <i className="material-symbols-rounded">bolt</i> Real-time
        </span>
      </div>
    </div>
  </div>
);

export default ChatWelcomePoster;
