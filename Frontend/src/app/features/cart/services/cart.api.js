import axios from 'axios';

const cartapi = axios.create({
    baseURL: "/api/cart",
    withCredentials: true
});

export async function getCart() {
    try {
        const res = await cartapi.get('/');
        return res.data;
    } catch (error) {
        throw error.response?.data || { msg: "Failed to fetch cart" };
    }
}

export async function getCartWithPricingApi() {
    try {
        const res = await cartapi.get('/pricing');
        return res.data;
    } catch (error) {
        throw error.response?.data || { msg: "Failed to fetch cart pricing" };
    }
}

export async function addToCartApi({ productId, quantity, variantId }) {
    try {
        const res = await cartapi.post('/add', { productId, quantity, variantId });
        return res.data;
    } catch (error) {
        throw error.response?.data || { msg: "Failed to add to cart" };
    }
}

export async function updateCartApi({ productId, quantity, variantId }) {
    try {
        const res = await cartapi.put('/update', { productId, quantity, variantId });
        return res.data;
    } catch (error) {
        throw error.response?.data || { msg: "Failed to update cart" };
    }
}

export async function removeFromCartApi({ productId, variantId }) {
    try {
        const res = await cartapi.post('/remove', { productId, variantId });
        return res.data;
    } catch (error) {
        throw error.response?.data || { msg: "Failed to remove from cart" };
    }
}

export async function checkoutApi() {
    try {
        const res = await cartapi.post('/checkout');
        return res.data;
    } catch (error) {
        throw error.response?.data || { msg: "Checkout failed" };
    }
}

