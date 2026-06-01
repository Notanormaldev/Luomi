import productmodel from "../models/product.model.js";
import { ChatOllama } from "@langchain/ollama";

const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "llama3",
});

async function askJerry(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, msg: "Message query is required" });
    }

    const product = await productmodel.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    // Build rich variant context string
    const variantDetails = (product.variants || []).map((v, i) => {
      const attrs = Object.entries(v.attributes || {}).map(([k, val]) => `${k}: ${val}`).join(', ');
      return `Variant ${i + 1}: ${attrs} | Stock: ${v.stock ?? 0} | Price: ₹${v.price?.amount ?? product.price?.amount}`;
    }).join('\n');

    const systemPrompt = `You are "Jerry", a helpful and friendly AI shopping assistant for Luomi — a modern fashion brand.

You are helping a customer who is looking at this specific product:
- Name: ${product.title}
- Category: ${product.genderCategory}'s ${product.subCategory}
- Description: ${product.description || 'Not provided'}
- Base Price: ₹${product.price?.amount}
- Total Stock (base): ${product.stock ?? 0}
${variantDetails ? `- Variants available:\n${variantDetails}` : '- No variants available'}

Your job is to answer questions about THIS specific product. Be direct, helpful, and concise.
Rules:
1. Answer based on ACTUAL product data above — do NOT make up info not in the data.
2. If asked about sizes: list the actual available sizes from variants.
3. If asked about fit: read the description for hints (slim, relaxed, oversized, etc).
4. If asked about material: read the description for hints (linen, cotton, denim, etc).
5. Keep answers under 3-4 sentences. Be friendly, not fancy.
6. Do NOT use "silhouette", "atelier", "maison" or luxury fashion jargon.
7. If you don't know something specific, say so honestly.`;

    let reply = "";
    try {
      // Fast check if local Ollama is responsive (500ms timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 500);
      await fetch("http://localhost:11434", { signal: controller.signal }).catch(() => {
        throw new Error("Ollama is offline");
      });
      clearTimeout(timeoutId);

      const response = await model.invoke([
        ["system", systemPrompt],
        ["user", message]
      ]);
      reply = response.content;
    } catch (ollamaErr) {
      console.warn("Ollama offline/failed, using smart dynamic fallback:", ollamaErr.message);

      const query = message.toLowerCase();
      const desc = (product.description || "").toLowerCase();

      // Extract unique sizes and colors
      const sizes = [];
      const colors = [];
      (product.variants || []).forEach(v => {
        const attrs = v.attributes || {};
        Object.entries(attrs).forEach(([k, val]) => {
          if (k.toLowerCase() === 'size') sizes.push(val);
          if (k.toLowerCase() === 'color') colors.push(val);
        });
      });
      const uniqueSizes = [...new Set(sizes)];
      const uniqueColors = [...new Set(colors)];

      const matchedAnswers = [];

      // 1. SIZES & FIT
      if (query.includes("size") || query.includes("sizing") || query.includes("fit") || query.includes("tight") || query.includes("loose") || query.includes("baggy") || query.includes("run")) {
        let fitText = "";
        if (desc.includes("oversized")) fitText = "It features an oversized fit (runs slightly large for a relaxed street look).";
        else if (desc.includes("slim") || desc.includes("skinny")) fitText = "It features a modern slim fit (fits close to the body).";
        else if (desc.includes("relaxed")) fitText = "It has a relaxed, comfortable fit.";
        else fitText = "It fits true to size.";

        if (uniqueSizes.length > 0) {
          matchedAnswers.push(`**Sizes & Fit:** Available in **${uniqueSizes.join(', ')}**. ${fitText}`);
        } else {
          matchedAnswers.push(`**Sizes & Fit:** ${fitText}`);
        }
      }

      // 2. COLORS
      if (query.includes("color") || query.includes("colour") || query.includes("shade") || query.includes("what color")) {
        if (uniqueColors.length > 0) {
          matchedAnswers.push(`**Colors:** Available in **${uniqueColors.join(', ')}**.`);
        } else {
          matchedAnswers.push(`**Colors:** Available in the primary color shown in the display images.`);
        }
      }

      // 3. MATERIAL / FABRIC
      if (query.includes("material") || query.includes("fabric") || query.includes("made of") || query.includes("composition") || query.includes("wash") || query.includes("cotton") || query.includes("linen") || query.includes("polyester")) {
        let mat = "premium comfort fabric";
        if (desc.includes("linen")) mat = "linen — lightweight, breathable, and perfect for warm weather";
        else if (desc.includes("cotton")) mat = "100% premium cotton — soft, comfortable, and breathable";
        else if (desc.includes("denim") || product.subCategory?.toLowerCase() === "jeans") mat = "durable premium denim";
        else if (desc.includes("wool")) mat = "warm, insulating wool blend";
        else if (desc.includes("polyester")) mat = "crease-resistant polyester blend";
        else if (desc.includes("viscose")) mat = "silky soft viscose";
        else if (desc.includes("stretch")) mat = "stretch blend for added mobility";

        let washText = desc.includes("cold") || desc.includes("wash") ? " Recommend gentle cold machine wash." : "";
        matchedAnswers.push(`**Material & Care:** Crafted from ${mat}.${washText}`);
      }

      // 4. STOCK & AVAILABILITY
      if (query.includes("stock") || query.includes("available") || query.includes("buy") || query.includes("order") || query.includes("quantity")) {
        const totalStock = (product.variants || []).reduce((acc, v) => acc + (v.stock || 0), product.stock || 0);
        if (totalStock <= 0) {
          matchedAnswers.push(`**Availability:** This product is currently **Out of Stock**.`);
        } else if (totalStock < 5) {
          matchedAnswers.push(`**Availability:** Only **${totalStock} items left** in stock. Grab yours before it sells out!`);
        } else {
          matchedAnswers.push(`**Availability:** Ready to ship (**${totalStock} items in stock**).`);
        }
      }

      // 5. PRICE
      if (query.includes("price") || query.includes("cost") || query.includes("how much") || query.includes("rupee") || query.includes("inr")) {
        matchedAnswers.push(`**Price:** It is priced at **₹${product.price?.amount?.toLocaleString()}**.`);
      }

      // 6. STYLING / PAIRING
      if (query.includes("style") || query.includes("pair") || query.includes("match") || query.includes("wear with") || query.includes("look")) {
        const isTop = ['shirt', 't-shirt', 'polos'].includes(product.subCategory?.toLowerCase());
        if (isTop) {
          matchedAnswers.push(`**Styling Tip:** This top looks great when paired with casual denim, structured chinos, or modern cargos. Keep bottoms simple to emphasize the fit.`);
        } else {
          matchedAnswers.push(`**Styling Tip:** Style these bottoms with an oversized solid tee or a relaxed button-down shirt. Complete the look with clean white sneakers.`);
        }
      }

      // If they ask a generic query or "tell me about this product"
      if (matchedAnswers.length === 0 && (query.includes("tell") || query.includes("about") || query.includes("what is") || query.includes("detail") || query.includes("info"))) {
        matchedAnswers.push(`**${product.title}** is a ${product.genderCategory}'s ${product.subCategory || 'apparel'} priced at **₹${product.price?.amount?.toLocaleString()}**. ${product.description || ''}`);
        if (uniqueSizes.length > 0) matchedAnswers.push(`**Sizes:** ${uniqueSizes.join(', ')}`);
      }

      if (matchedAnswers.length > 0) {
        reply = matchedAnswers.join('\n\n');
      } else {
        reply = `Hi! I'm **Jerry** 👋, your Luomi personal shopping assistant. 

I can answer any questions about **${product.title}**:
- **Sizes & Fit** (available sizes, fit recommendation)
- **Fabric & Care** (materials, wash instructions)
- **Colors** (shades and swatches)
- **Stock Status** & **Pricing**
- **Styling Suggestions**

What would you like to know?`;
      }
    }

    return res.status(200).json({
      success: true,
      reply
    });
  } catch (error) {
    console.error("askJerry Error:", error);
    return res.status(500).json({ success: false, msg: "Failed to query style assistant" });
  }
}

export default {
  askJerry
};
