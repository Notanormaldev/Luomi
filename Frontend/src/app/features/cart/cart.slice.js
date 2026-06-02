import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
    name: "cart",
    initialState: {
        items: [],
        subtotal: 0,
        loading: false,
        error: null
    },
    reducers: {
        setCartItems: (state, action) => {
            state.items = action.payload;
        },
        setSubtotal: (state, action) => {
            state.subtotal = action.payload;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        clearCart: (state) => {
            state.items = [];
            state.subtotal = 0;
            state.error = null;
        }
    }
});

export const { setCartItems, setSubtotal, setLoading, setError, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
