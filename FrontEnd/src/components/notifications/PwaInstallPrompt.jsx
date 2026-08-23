import React, { useState, useEffect } from "react";
import style from "./pwaInstallPrompt.module.scss";

export const PwaInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("PWA install outcome:", outcome);
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className={style.pwa_install_banner}>
            <div className={style.content}>
                <div className={style.app_icon}>
                    <img src="/icon_400.png" alt="PIXR" />
                </div>
                <div className={style.text}>
                    <h4>Install PIXR App</h4>
                    <p>Get fast access & full screen app experience</p>
                </div>
            </div>
            <div className={style.actions}>
                <button type="button" className={style.install_btn} onClick={handleInstallClick}>
                    Install
                </button>
                <button type="button" className={style.dismiss_btn} onClick={handleDismiss}>
                    <i className="material-symbols-rounded">close</i>
                </button>
            </div>
        </div>
    );
};
