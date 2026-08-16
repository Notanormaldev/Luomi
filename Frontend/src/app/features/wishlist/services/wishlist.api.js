import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const wishlistapi = axios.create({
    baseURL: `${API_BASE}/api/wishlist`,
    withCredentials: true
});

export async function getWishlist() {
    try {
        const res = await wishlistapi.get('/');
        return res.data;
    } catch (error) {
        throw error.response?.data || { msg: "Failed to fetch wishlist" };
    }
}

export async function toggleWishlistApi({ productId }) {
    try {
        const res = await wishlistapi.post('/toggle', { productId });
        return res.data;
    } catch (error) {
        throw error.response?.data || { msg: "Failed to update wishlist" };
    }
}
