import style from "./input.module.scss"

export const Input = ({ state, setState, isFocused, icon, style_class, type, placeholder }) => {
    return (
        <section className={`${style_class} ${style.input_wrapper}`}>
            <i className={`material-symbols-rounded ${style.input_icon}`}>{icon}</i>
            <input value={state} onChange={(e) => setState(e.target.value)} onFocus={() => isFocused ? isFocused(true) : null} onBlur={() => isFocused ? isFocused(false) : null} className={style.input_field} type={type} placeholder={placeholder} />
        </section>
    )
}