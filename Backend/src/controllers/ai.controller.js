import productmodel from "../models/product.model.js";

async function askSid(req, res) {
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

    const query = message.toLowerCase();
    let reply = "";

    // 1. About the product / general details
    if (query.includes("about") || query.includes("detail") || query.includes("what is this")) {
      reply = `**"${product.title}"** is a premium ${product.genderCategory || 'men'}'s ${product.subCategory || 'apparel'} designed by our Maison independent ateliers. It is listed at a base value of ${product.price?.currency || 'INR'} ${product.price?.amount?.toLocaleString() || '0.00'}. \n\n**Storytelling Narrative:** ${product.description || 'An elegant minimal drape designed to wow at first glance.'}`;
    }
    // 2. Material details
    else if (query.includes("material") || query.includes("fabric") || query.includes("made of") || query.includes("composition")) {
      const desc = (product.description || "").toLowerCase();
      let detectedMaterial = "our signature high-density cotton-linen blend";
      if (desc.includes("linen")) detectedMaterial = "100% premium lightweight linen";
      else if (desc.includes("cotton")) detectedMaterial = "100% long-staple organic cotton";
      else if (desc.includes("denim") || product.subCategory === "jeans") detectedMaterial = "rigid heavy-ounce cotton denim";
      else if (desc.includes("wool")) detectedMaterial = "merino wool";
      else if (desc.includes("polyester") || desc.includes("nylon")) detectedMaterial = "technical synthetic blend";

      reply = `This silhouette is meticulously crafted from **${detectedMaterial}**. It is tailored for a luxurious, soft hand-feel, superb breathability, and structure retention over time. We recommend dry cleaning or cold delicate machine wash.`;
    }
    // 3. Fit details
    else if (query.includes("fit") || query.includes("size") || query.includes("sizing") || query.includes("tight") || query.includes("loose")) {
      const desc = (product.description || "").toLowerCase();
      let fitType = "relaxed drape";
      if (desc.includes("oversized")) fitType = "oversized slouchy fit";
      else if (desc.includes("slim") || desc.includes("skinny")) fitType = "slender slim-fit cut";
      else if (desc.includes("regular")) fitType = "classic regular-fit silhouette";
      else if (desc.includes("baggy") || desc.includes("relaxed")) fitType = "generous relaxed streetwear drape";

      reply = `It features a **${fitType}**. It is structured to run true to size for a modern look. If you prefer a more traditional fitted style, you might consider sizing down.`;
    }
    // 4. Pairing / coordinates styling
    else if (query.includes("pair") || query.includes("match") || query.includes("wear with") || query.includes("styling") || query.includes("tops") || query.includes("bottoms")) {
      if (['shirt', 't-shirt', 'polos'].includes(product.subCategory)) {
        reply = `To pair with **"${product.title}"**, we suggest styled coordinates such as our **Maison Relaxed Jeans** or **Technical Cargo Pants** in washed charcoal or slate grey. Complete the look with clean monochrome sneakers and simple silver hardware accessories.`;
      } else {
        reply = `For styling this bottom silhouette, we suggest pairing it with one of our **Maison Oversized Linen Shirts** or a **Technical Polo T-Shirt** tucked in. Throwing on a structural overshirt or minimalist leather jacket will complete the ultimate silent luxury aesthetic.`;
      }
    }
    // 5. Default fallback style advice
    else {
      reply = `Hello! I'm **Sid**, your AI style counselor. Regarding **"${product.title}"**, this piece is an excellent addition to a minimalist wardrobe. \n\nIs there anything specific you would like to know about its **materials**, **fit drapes**, **pairing options**, or care guidelines?`;
    }

    return res.status(200).json({
      success: true,
      reply
    });
  } catch (error) {
    console.error("askSid Error:", error);
    return res.status(500).json({ success: false, msg: "Failed to query style assistant" });
  }
}

export default {
  askSid
};
