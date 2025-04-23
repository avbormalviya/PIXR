import { Outlet } from "react-router-dom"
import { Logo } from "../../components/logo/Logo"
import style from "./auth.module.scss"

export const Auth = () => {

    return (
        <section className={style.__container}>
            <div className={style.gradient_holder}></div>

            <section className={style.from_section}>
                <Logo styles={style.logo} />

                <Outlet />
            </section>
        </section>
    )
}
