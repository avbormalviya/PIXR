import { Logo } from '../logo/Logo'
import style from './header.module.scss'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SwitchAccount } from '../../features/switchAccount/SwitchAccount'

export const Header = () => {
    const navigate = useNavigate();
    const [showSwitch, setShowSwitch] = useState(false);
    const headerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (headerRef.current && !headerRef.current.contains(e.target)) {
                setShowSwitch(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className={style.header_section} ref={headerRef}>
            <Logo styles={style.logo} />
            <section style={{ position: 'relative' }}>
                <span
                    onClick={() => setShowSwitch(!showSwitch)}
                    className="material-symbols-rounded"
                    title="Switch Account"
                    style={{ cursor: 'pointer', color: showSwitch ? '#0094f6' : 'inherit' }}
                >
                    switch_account
                </span>
                <span onClick={() => navigate('/notifications')} className="material-symbols-rounded">favorite</span>
                <span onClick={() => navigate('/chat')} className="material-symbols-rounded">chat</span>

                {showSwitch && (
                    <SwitchAccount isModal={true} onClose={() => setShowSwitch(false)} />
                )}
            </section>
        </header>
    );
};