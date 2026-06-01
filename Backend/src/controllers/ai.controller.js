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
      const response = await model.invoke([
        ["system", systemPrompt],
        ["user", message]
      ]);
      reply = response.content;
    } catch (ollamaErr) {
      console.warn("Ollama offline, using smart fallback:", ollamaErr.message);

      const query = message.toLowerCase();
      const desc = (product.description || "").toLowerCase();

      // Extract actual sizes from variants
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

      if (query.includes("size") || query.includes("sizing") || query.includes("fit size") || query.includes("what size")) {
        if (uniqueSizes.length > 0) {
          reply = `Available sizes for **${product.title}** are: **${uniqueSizes.join(', ')}**. ${desc.includes('slim') ? 'This has a slim fit — consider sizing up if you prefer a relaxed feel.' : desc.includes('oversized') ? 'This is oversized — it runs large, so you may want to size down.' : desc.includes('relaxed') ? 'This has a relaxed fit — true to size or size down for a fitted look.' : 'It runs true to size.'}`;
        } else {
          reply = `**${product.title}** doesn't have specific size variants listed. ${desc.includes('slim') ? 'Based on the description, it has a slim fit.' : desc.includes('relaxed') ? 'It has a relaxed fit.' : 'Check the description for fit details.'}`;
        }
      } else if (query.includes("color") || query.includes("colour") || query.includes("colors available")) {
        if (uniqueColors.length > 0) {
          reply = `**${product.title}** is available in: **${uniqueColors.join(', ')}**. You can select your preferred color from the swatches above.`;
        } else {
          reply = `No specific color variants are listed for **${product.title}**. The product comes as shown in the images.`;
        }
      } else if (query.includes("material") || query.includes("fabric") || query.includes("made of") || query.includes("composition")) {
        let mat = "fabric details not specified in description";
        if (desc.includes("linen")) mat = "linen fabric — lightweight, breathable, great for summer";
        else if (desc.includes("cotton")) mat = "cotton — comfortable, soft, and easy to care for";
        else if (desc.includes("denim") || product.subCategory === "jeans") mat = "denim fabric";
        else if (desc.includes("wool")) mat = "wool";
        else if (desc.includes("polyester")) mat = "polyester blend";
        else if (desc.includes("stretch")) mat = "stretch fabric — great for all-day comfort";
        reply = `**${product.title}** is made from ${mat}. ${desc.includes("cold") || desc.includes("wash") ? "Recommended cold wash." : "Check the label for washing instructions."}`;
      } else if (query.includes("fit") || query.includes("tight") || query.includes("loose") || query.includes("baggy")) {
        let fitType = "regular fit";
        if (desc.includes("oversized")) fitType = "oversized — runs large";
        else if (desc.includes("slim") || desc.includes("skinny")) fitType = "slim fit — runs close to the body";
        else if (desc.includes("regular")) fitType = "regular fit — true to size";
        else if (desc.includes("baggy") || desc.includes("relaxed")) fitType = "relaxed fit — looser and comfortable";
        reply = `**${product.title}** has a **${fitType}**. ${uniqueSizes.length > 0 ? `Available in sizes: ${uniqueSizes.join(', ')}.` : ''} If between sizes, go one size up for comfort.`;
      } else if (query.includes("stock") || query.includes("available") || query.includes("in stock")) {
        const totalStock = (product.variants || []).reduce((acc, v) => acc + (v.stock || 0), product.stock || 0);
        reply = `**${product.title}** has **${totalStock} items** available across all variants. ${totalStock < 5 ? "⚠️ Low stock — order soon!" : "Stock is good!"}`;
      } else if (query.includes("price") || query.includes("cost") || query.includes("how much")) {
        reply = `**${product.title}** is priced at **₹${product.price?.amount?.toLocaleString() || 'N/A'}**. ${(product.variants || []).length > 0 ? 'Some variants may have different pricing — check when you select a variant.' : ''}`;
      } else if (query.includes("about") || query.includes("tell me") || query.includes("what is") || query.includes("detail")) {
        reply = `**${product.title}** is a ${product.genderCategory}'s ${product.subCategory} priced at ₹${product.price?.amount?.toLocaleString()}. ${product.description || ''} ${uniqueSizes.length > 0 ? `Available sizes: ${uniqueSizes.join(', ')}.` : ''}`;
      } else if (query.includes("pair") || query.includes("match") || query.includes("wear with") || query.includes("style")) {
        const isTop = ['shirt', 't-shirt', 'polos'].includes(product.subCategory);
        if (isTop) {
          reply = `**${product.title}** pairs well with jeans, chinos, or cargo pants. Keep the bottom simple to let the top stand out.`;
        } else {
          reply = `**${product.title}** looks great with a simple t-shirt or a casual shirt on top. Sneakers or loafers work well as footwear.`;
        }
      } else {
        reply = `I can help you with info about **${product.title}**! Ask me about sizes, fit, material, colors, or how to style it. What would you like to know?`;
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
