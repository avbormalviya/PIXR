export const emit = (io, room, event, data) => {
    io.to(room).emit(event, data);
}

export const on = (io, room, event, callback) => {
    io.to(room).on(event, callback);
}