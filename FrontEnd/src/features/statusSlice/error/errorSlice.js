import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    error: null
}

const errorSlice = createSlice({
    name: "globalError",

    initialState,

    reducers: {
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const { setError, clearError } = errorSlice.actions;
export default errorSlice.reducer;
