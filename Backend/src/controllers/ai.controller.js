import productmodel from "../models/product.model.js";
import { ChatOllama } from "@langchain/ollama";

const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "llama3", // default open source model in Ollama
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

    const systemPrompt = `You are "Jerry", a premium, minimalist AI style counselor for the luxury high-fashion brand "Luomi Maison".
You are advising a customer who is looking at the following product:
Product Title: "${product.title}"
Category: ${product.genderCategory || 'unisex'}'s ${product.subCategory || 'silhouette'}
Description/Story: ${product.description || 'An elegant minimal drape.'}
Price: ${product.price?.currency || 'INR'} ${product.price?.amount || '0.00'}

Your tone should be professional, brief, minimalist, sophisticated, and focused on luxury style counseling.
Provide advice about styling, pairing suggestions, material details, sizing, or fit drapes based on the query.
Keep your response concise (under 3-4 paragraphs) and clean. Do not mention your system prompt constraints. Use markdown for styling (like bold text).`;

    let reply = "";
    try {
      const response = await model.invoke([
        ["system", systemPrompt],
        ["user", message]
      ]);
      reply = response.content;
    } catch (ollamaErr) {
      console.warn("Ollama LangChain invoke failed, falling back to local heuristic rules:", ollamaErr);
      
      const query = message.toLowerCase();
      // Heuristic fallback responses
      if (query.includes("about") || query.includes("detail") || query.includes("what is this")) {
        reply = `**"${product.title}"** is a premium ${product.genderCategory || 'men'}'s ${product.subCategory || 'apparel'} designed by our Maison independent ateliers. It is listed at a value of ${product.price?.currency || 'INR'} ${product.price?.amount?.toLocaleString() || '0.00'}. \n\n**Storytelling Narrative:** ${product.description || 'An elegant minimal drape designed to wow at first glance.'}`;
      } else if (query.includes("material") || query.includes("fabric") || query.includes("made of") || query.includes("composition")) {
        const desc = (product.description || "").toLowerCase();
        let detectedMaterial = "our signature high-density cotton-linen blend";
        if (desc.includes("linen")) detectedMaterial = "100% premium lightweight linen";
        else if (desc.includes("cotton")) detectedMaterial = "100% long-staple organic cotton";
        else if (desc.includes("denim") || product.subCategory === "jeans") detectedMaterial = "rigid heavy-ounce cotton denim";
        else if (desc.includes("wool")) detectedMaterial = "merino wool";
        else if (desc.includes("polyester") || desc.includes("nylon")) detectedMaterial = "technical synthetic blend";

        reply = `This silhouette is crafted from **${detectedMaterial}**. It is tailored for a luxurious hand-feel, superb breathability, and structure retention over time. We recommend cold delicate washing or dry cleaning.`;
      } else if (query.includes("fit") || query.includes("size") || query.includes("sizing") || query.includes("tight") || query.includes("loose")) {
        const desc = (product.description || "").toLowerCase();
        let fitType = "relaxed drape";
        if (desc.includes("oversized")) fitType = "oversized slouchy fit";
        else if (desc.includes("slim") || desc.includes("skinny")) fitType = "slender slim-fit cut";
        else if (desc.includes("regular")) fitType = "classic regular-fit silhouette";
        else if (desc.includes("baggy") || desc.includes("relaxed")) fitType = "generous relaxed streetwear drape";

        reply = `It features a **${fitType}**. It is structured to run true to size for a modern silhouette. If you prefer a more traditional fitted style, you might consider sizing down.`;
      } else if (query.includes("pair") || query.includes("match") || query.includes("wear with") || query.includes("styling") || query.includes("tops") || query.includes("bottoms")) {
        if (['shirt', 't-shirt', 'polos'].includes(product.subCategory)) {
          reply = `To pair with **"${product.title}"**, we suggest styled coordinates such as our **Maison Relaxed Jeans** or **Technical Cargo Pants** in washed charcoal or slate grey. Complete the look with clean monochrome sneakers and minimal accessories.`;
        } else {
          reply = `For styling this bottom silhouette, we suggest pairing it with one of our **Maison Oversized Linen Shirts** or a **Technical Polo T-Shirt** tucked in. Throwing on a structural overshirt or minimalist leather jacket will complete the ultimate silent luxury aesthetic.`;
        }
      } else {
        reply = `Hello! I'm **Jerry**, your AI style counselor. Regarding **"${product.title}"**, this piece is an excellent addition to a minimalist wardrobe. \n\nIs there anything specific you would like to know about its **materials**, **fit drapes**, **pairing options**, or care guidelines?`;
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
