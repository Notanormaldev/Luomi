import { useDispatch, useSelector } from "react-redux";
import { getWishlist, toggleWishlistApi } from "../services/wishlist.api";
import { setWishlistItems, setLoading, setError, toggleWishlistSuccess } from "../wishlist.slice";

export const usewishlist = () => {
    const dispatch = useDispatch();
    const { items, loading, error } = useSelector((state) => state.wishlist);

    async function handleGetWishlist() {
        dispatch(setLoading(true));
        dispatch(setError(null));
        try {
            const data = await getWishlist();
            dispatch(setWishlistItems(data.wishlist.products));
            dispatch(setLoading(false));
            return { success: true, items: data.wishlist.products };
        } catch (err) {
            console.error("usewishlist: handleGetWishlist error", err);
            dispatch(setError(err.msg || "Failed to fetch wishlist"));
            dispatch(setLoading(false));
            return { success: false, error: err.msg };
        }
    }

    async function handleToggleWishlist({ productId }) {
        dispatch(setLoading(true));
        dispatch(setError(null));
        try {
            const data = await toggleWishlistApi({ productId });
            dispatch(toggleWishlistSuccess({
                productId,
                added: data.added,
                updatedItems: data.wishlist.products
            }));
            dispatch(setLoading(false));
            return { success: true, added: data.added, items: data.wishlist.products, msg: data.msg };
        } catch (err) {
            console.error("usewishlist: handleToggleWishlist error", err);
            dispatch(setError(err.msg || "Failed to update wishlist"));
            dispatch(setLoading(false));
            return { success: false, error: err.msg };
        }
    }

    function isWishlisted(productId) {
        if (!items || !productId) return false;
        return items.some(item => (item._id || item) === productId);
    }

    return {
        items,
        loading,
        error,
        handleGetWishlist,
        handleToggleWishlist,
        isWishlisted
    };
};
