import { Navbar } from '../../components/navbar/Navbar'
import { Header } from '../../components/header/Header'
import { Suggest_desktop } from '../../features/suggestPeople/desktop/Suggest_desktop'
import { Outlet, useLocation } from 'react-router-dom'
import { Upload } from '../../components/upload/Upload'
import { useSelector } from 'react-redux'
import style from './home.module.scss'

export const Home = () => {

    const location = useLocation();

    const { feedUpload } = useSelector(state => state.user);

    return (
        <main>
            {location.pathname === '/' && (
                <section className={style.header}>
                    <Header />
                </section>
            )}

            <section className={style.navbar}>
                <Navbar />
            </section>
            
            <section className={style.outlet}>
                <Outlet />
            </section>
            
            {location.pathname !== '/chat' && (
                <section className={style.suggest} >
                    <Suggest_desktop />
                </section>
            )}

            {
                feedUpload && (
                    <Upload />
                )
            }
        </main>
    )
}