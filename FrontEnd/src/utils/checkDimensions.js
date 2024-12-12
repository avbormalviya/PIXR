export const checkDimensions = (element) => {
    const width = element.clientWidth;
    const height = element.clientHeight;

    if (width > height) return "width";
    else if (height > width) return "height";
    else return ;
}