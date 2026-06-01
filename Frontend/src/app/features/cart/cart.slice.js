import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
    name: "cart",
    initialState: {
        items: [],
        loading: false,
        error: null
    },
    reducers: {
        setCartItems: (state, action) => {
            state.items = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearCart: (state) => {
            state.items = [];
            state.error = null;
        }
    }
});

export const { setCartItems, setLoading, setError, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
