import { Logo } from '../logo/Logo'
import style from './header.module.scss'

import { useNavigate } from 'react-router-dom'

export const Header = () => {

    const navigate = useNavigate();

    return (
        <header className={style.header_section}>
            <Logo styles={style.logo} />
            <section>
                <span onClick={() => navigate('/notifications')} className="material-symbols-rounded">favorite</span>
                <span onClick={() => navigate('/chat')} className="material-symbols-rounded">chat</span>
            </section>
        </header>
    )
}