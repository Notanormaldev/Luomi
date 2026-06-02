import { createSlice } from "@reduxjs/toolkit";

const wishlistSlice = createSlice({
    name: "wishlist",
    initialState: {
        items: [],
        loading: false,
        error: null
    },
    reducers: {
        setWishlistItems: (state, action) => {
            state.items = action.payload || [];
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        toggleWishlistSuccess: (state, action) => {
            const { productId, added, updatedItems } = action.payload;
            state.items = updatedItems || [];
        }
    }
});

export const { setWishlistItems, setLoading, setError, toggleWishlistSuccess } = wishlistSlice.actions;
export default wishlistSlice.reducer;
