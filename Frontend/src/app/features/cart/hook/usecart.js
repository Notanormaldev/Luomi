import { useDispatch, useSelector } from "react-redux";
import { getCart, addToCartApi, updateCartApi, removeFromCartApi, checkoutApi } from "../services/cart.api";
import { setCartItems, setLoading, setError, clearCart } from "../cart.slice";

export const usecart = () => {
    const dispatch = useDispatch();
    const { items, loading, error } = useSelector((state) => state.cart);

    async function handleGetCart() {
        dispatch(setLoading(true));
        dispatch(setError(null));
        try {
            const data = await getCart();
            dispatch(setCartItems(data.cart.items));
            dispatch(setLoading(false));
            return { success: true, items: data.cart.items };
        } catch (err) {
            console.error("usecart: handleGetCart error", err);
            dispatch(setError(err.msg || "Failed to fetch cart"));
            dispatch(setLoading(false));
            return { success: false, error: err.msg };
        }
    }

    async function handleAddToCart({ productId, quantity, variantId }) {
        dispatch(setLoading(true));
        dispatch(setError(null));
        try {
            const data = await addToCartApi({ productId, quantity, variantId });
            dispatch(setCartItems(data.cart.items));
            dispatch(setLoading(false));
            return { success: true, items: data.cart.items, msg: data.msg };
        } catch (err) {
            console.error("usecart: handleAddToCart error", err);
            dispatch(setError(err.msg || "Failed to add to cart"));
            dispatch(setLoading(false));
            return { success: false, error: err.msg };
        }
    }

    async function handleUpdateCart({ productId, quantity, variantId }) {
        dispatch(setLoading(true));
        dispatch(setError(null));
        try {
            const data = await updateCartApi({ productId, quantity, variantId });
            dispatch(setCartItems(data.cart.items));
            dispatch(setLoading(false));
            return { success: true, items: data.cart.items, msg: data.msg };
        } catch (err) {
            console.error("usecart: handleUpdateCart error", err);
            dispatch(setError(err.msg || "Failed to update cart"));
            dispatch(setLoading(false));
            return { success: false, error: err.msg };
        }
    }

    async function handleRemoveFromCart({ productId, variantId }) {
        dispatch(setLoading(true));
        dispatch(setError(null));
        try {
            const data = await removeFromCartApi({ productId, variantId });
            dispatch(setCartItems(data.cart.items));
            dispatch(setLoading(false));
            return { success: true, items: data.cart.items, msg: data.msg };
        } catch (err) {
            console.error("usecart: handleRemoveFromCart error", err);
            dispatch(setError(err.msg || "Failed to remove from cart"));
            dispatch(setLoading(false));
            return { success: false, error: err.msg };
        }
    }

    function handleClearCart() {
        dispatch(clearCart());
    }

    async function handleCheckout() {
        dispatch(setLoading(true));
        dispatch(setError(null));
        try {
            const data = await checkoutApi();
            dispatch(clearCart());
            dispatch(setLoading(false));
            return { success: true, order: data.order, msg: data.msg };
        } catch (err) {
            console.error("usecart: handleCheckout error", err);
            dispatch(setError(err.msg || "Checkout failed"));
            dispatch(setLoading(false));
            return { success: false, error: err.msg };
        }
    }

    return {
        items,
        loading,
        error,
        handleGetCart,
        handleAddToCart,
        handleUpdateCart,
        handleRemoveFromCart,
        handleClearCart,
        handleCheckout
    };
};
