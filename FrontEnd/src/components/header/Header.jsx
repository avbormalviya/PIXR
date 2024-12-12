import style from './header.module.scss'

import { useNavigate } from 'react-router-dom'

export const Header = () => {

    const navigate = useNavigate();

    return (
        <header>
            <h1>PIXR</h1>
            <section>
                <span onClick={() => navigate('/notifications')} className="material-symbols-rounded">favorite</span>
                <span onClick={() => navigate('/chat')} className="material-symbols-rounded">chat</span>
            </section>
        </header>
    )
}