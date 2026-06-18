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

    // Use .lean() to get a clean JSON object without Mongoose prototype states
    const product = await productmodel.findById(id).lean();
    if (!product) {
      return res.status(404).json({ success: false, msg: "Product not found" });
    }

    // Also fetch all other products in case Ollama needs to compare or suggest alternatives
    const allProducts = await productmodel.find({}).lean();

    const systemPrompt = `You are "Jerry", a helpful and friendly AI shopping assistant for Luomi — a modern fashion brand.

You are helping a customer who is looking at this specific product. Here is the complete raw product database record in JSON format:
${JSON.stringify(product, null, 2)}

Here is the entire product catalog in our store database in JSON format (use this if the user asks for other colors, items, or comparisons):
${JSON.stringify(allProducts, null, 2)}

Your job is to answer questions about the current product or recommend other items in the catalog. Be direct, helpful, and concise.
Rules:
1. Answer based on ACTUAL product data above — do NOT make up info not in the data.
2. If asked about sizes: list the actual available sizes from variants.
3. If asked about fit: read the description for hints (slim, relaxed, oversized, etc).
4. If asked about material: read the description for hints (linen, cotton, denim, etc).
5. Keep answers under 3-4 sentences. Be friendly, not fancy.
6. Do NOT use "silhouette", "atelier", "maison" or luxury fashion jargon.
7. If you don't know something specific, say so honestly.
8. If you suggest or recommend other products from the catalog, you MUST format them as Markdown links in the exact format: [Product Title](/product/productId) followed by the price (e.g. "We also recommend the [Short-Sleeve Utility Camp Shirt](/product/12345) (₹999)"). This is crucial so that the user can click on the product to navigate there.`;

    let reply = "";
    try {
      // If GEMINI_API_KEY is present in environment variables, prioritize the Gemini Cloud API (ideal for production hosting)
      if (process.env.GEMINI_API_KEY) {
        const apiKey = process.env.GEMINI_API_KEY;
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: `${systemPrompt}\n\nUser Question: ${message}` }
                  ]
                }
              ],
              generationConfig: {
                maxOutputTokens: 300,
                temperature: 0.7
              }
            })
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else {
          const errText = await response.text();
          throw new Error(`Gemini API error: ${errText}`);
        }
      } else {
        // Local fallback: Fast check if local Ollama is responsive (500ms timeout)
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
      }
    } catch (ollamaErr) {
      console.warn("Ollama offline/failed, using smart dynamic fallback:", ollamaErr.message);

      const query = message.toLowerCase();
      const desc = (product.description || "").toLowerCase();

      // Extract unique sizes and colors from variants
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

      // Tokenize query to check for exact word matching
      const queryWords = query.split(/[^a-z0-9]+/).filter(Boolean);

      // 0. GREETINGS (e.g., "hi", "hello", "hey", "yo", "hey jerry")
      const greetings = ["hi", "hello", "hey", "yo", "greet", "jerry"];
      const isSimpleGreeting = queryWords.length <= 3 && queryWords.some(w => greetings.includes(w));
      if (isSimpleGreeting) {
        matchedAnswers.push(`Hello! I'm Jerry 👋, your personal shopping assistant for Luomi. I'm here to help you with the **${product.title}**. Ask me about its sizes, fit, material, styling options, or price!`);
      }

      // Check if a specific size is asked (e.g., "4xl", "xl", "m")
      const standardSizes = ["xs", "s", "m", "l", "xl", "xxl", "3xl", "4xl", "5xl"];
      const askedSize = uniqueSizes.find(sz => queryWords.includes(sz.toLowerCase())) || 
                        standardSizes.find(sz => queryWords.includes(sz));

      // Check if a specific color is asked (e.g., "green", "blue")
      const standardColors = ["black", "white", "blue", "green", "red", "yellow", "grey", "gray", "pink", "brown", "beige", "navy"];
      const askedColor = uniqueColors.find(col => queryWords.includes(col.toLowerCase())) || 
                         standardColors.find(col => queryWords.includes(col));

      // Check if a budget/price range number is mentioned
      const mentionedNumbers = queryWords.map(w => parseInt(w)).filter(n => !isNaN(n) && n > 50);
      const budgetLimit = mentionedNumbers.length > 0 ? Math.min(...mentionedNumbers) : null;

      // Check if they are referring to a different category/product
      const productKeywords = ["shirt", "shirts", "tshirt", "tshirts", "t-shirt", "t-shirts", "pants", "cargo", "cargos", "polo", "polos", "trouser", "trousers", "jean", "jeans", "hoodie", "hoodies", "sweatshirt", "sweatshirts", "activewear", "gym", "running", "jacket", "jackets", "windbreaker", "windbreakers", "shorts", "wear"];
      const foundKeywords = productKeywords.filter(kw => {
        const term = kw === "tshirt" ? "t-shirt" : kw;
        return queryWords.includes(kw) || query.includes(term);
      });
      
      const currentSubCat = (product.subCategory || "").toLowerCase();
      const currentTitle = (product.title || "").toLowerCase();
      const isAskingDifferentProduct = foundKeywords.some(kw => {
        const term = kw === "tshirt" ? "t-shirt" : kw;
        return !currentSubCat.includes(term) && !currentTitle.includes(term);
      });

      // Override: If asking about a different product and size
      let sizeChecked = false;
      if (askedSize && isAskingDifferentProduct) {
        const matchedProducts = allProducts.filter(p => {
          if (p._id.toString() === product._id.toString()) return false;
          const titleLower = (p.title || "").toLowerCase();
          const descLower = (p.description || "").toLowerCase();
          const subCatLower = (p.subCategory || "").toLowerCase();
          
          const matchesKeyword = foundKeywords.some(kw => {
            const term = kw === "tshirt" ? "t-shirt" : kw;
            return titleLower.includes(term) || descLower.includes(term) || subCatLower.includes(term);
          });
          if (!matchesKeyword) return false;
          
          const sizeVariants = (p.variants || []).filter(v => 
            Object.entries(v.attributes || {}).some(([k, val]) => k.toLowerCase() === 'size' && val.toLowerCase() === askedSize.toLowerCase())
          );
          return sizeVariants.reduce((sum, v) => sum + (v.stock || 0), 0) > 0;
        });

        if (matchedProducts.length > 0) {
          const list = matchedProducts.slice(0, 3).map(p => `- [${p.title}](/product/${p._id}) (₹${p.price?.amount?.toLocaleString('en-IN')})`).join('\n');
          matchedAnswers.push(`Yes! I found these other items matching your request in size **${askedSize.toUpperCase()}**:\n${list}`);
        } else {
          matchedAnswers.push(`Sorry, we don't have any matching items in size **${askedSize.toUpperCase()}** in our catalog right now.`);
        }
        sizeChecked = true;
      }

      // Override: If asking about a different product and color
      let colorChecked = false;
      if (askedColor && isAskingDifferentProduct) {
        const matchedProducts = allProducts.filter(p => {
          if (p._id.toString() === product._id.toString()) return false;
          const titleLower = (p.title || "").toLowerCase();
          const descLower = (p.description || "").toLowerCase();
          const subCatLower = (p.subCategory || "").toLowerCase();
          
          const matchesKeyword = foundKeywords.some(kw => {
            const term = kw === "tshirt" ? "t-shirt" : kw;
            return titleLower.includes(term) || descLower.includes(term) || subCatLower.includes(term);
          });
          if (!matchesKeyword) return false;
          
          const colorVariants = (p.variants || []).filter(v => 
            Object.entries(v.attributes || {}).some(([k, val]) => k.toLowerCase() === 'color' && val.toLowerCase() === askedColor.toLowerCase())
          );
          return colorVariants.length > 0;
        });

        if (matchedProducts.length > 0) {
          const list = matchedProducts.slice(0, 3).map(p => `- [${p.title}](/product/${p._id}) (₹${p.price?.amount?.toLocaleString('en-IN')})`).join('\n');
          matchedAnswers.push(`Yes! I found these other items matching your request in **${askedColor.charAt(0).toUpperCase() + askedColor.slice(1)}**:\n${list}`);
        } else {
          matchedAnswers.push(`Sorry, we don't have any matching items in **${askedColor}** in our catalog right now.`);
        }
        colorChecked = true;
      }

      // 1. SPECIFIC SIZE AVAILABILITY (WITH CROSS-RECOMMENDATION)
      if (askedSize && !sizeChecked) {
        const sizeVariants = (product.variants || []).filter(v => 
          Object.entries(v.attributes || {}).some(([k, val]) => k.toLowerCase() === 'size' && val.toLowerCase() === askedSize.toLowerCase())
        );
        if (sizeVariants.length > 0) {
          const totalStockForSize = sizeVariants.reduce((sum, v) => sum + (v.stock || 0), 0);
          if (totalStockForSize > 0) {
            matchedAnswers.push(`Yes, size **${askedSize.toUpperCase()}** is available in stock!`);
          } else {
            matchedAnswers.push(`Size **${askedSize.toUpperCase()}** is currently out of stock for this product.`);
          }
        } else {
          // Find other products in catalog with this size
          const otherInSize = allProducts.filter(p => 
            p._id.toString() !== product._id.toString() &&
            (p.variants || []).some(v => 
              Object.entries(v.attributes || {}).some(([k, val]) => k.toLowerCase() === 'size' && val.toLowerCase() === askedSize.toLowerCase())
            )
          );
          if (otherInSize.length > 0) {
            const list = otherInSize.slice(0, 3).map(p => `- [${p.title}](/product/${p._id}) (₹${p.price?.amount?.toLocaleString('en-IN')})`).join('\n');
            matchedAnswers.push(`No, sorry. Size **${askedSize.toUpperCase()}** is not available for this product (Available sizes: **${uniqueSizes.join(', ') || 'None'}**).\n\nHowever, these other items are available in size **${askedSize.toUpperCase()}**:\n${list}`);
          } else {
            matchedAnswers.push(`No, sorry. Size **${askedSize.toUpperCase()}** is not available for this product. Available sizes are: **${uniqueSizes.join(', ') || 'None'}**.`);
          }
        }
        sizeChecked = true;
      }

      // 2. GENERAL SIZE LIST
      if (!sizeChecked && (query.includes("size") || query.includes("sizing") || query.includes("measure") || query.includes("dimension") || query.includes("avl") || query.includes("available"))) {
        if (uniqueSizes.length > 0) {
          matchedAnswers.push(`**Available Sizes:** We offer this product in **${uniqueSizes.join(', ')}**.`);
        } else {
          matchedAnswers.push(`**Available Sizes:** Standard sizing applies. Current stock is **${product.stock || 0}**.`);
        }
      }

      // 3. FIT RECOMMENDATIONS
      if (query.includes("fit") || query.includes("tight") || query.includes("loose") || query.includes("baggy") || query.includes("run") || query.includes("silhouette")) {
        let fitText = "It fits true to size.";
        if (desc.includes("oversized")) {
          fitText = "It features an oversized fit, designed to run slightly large for a relaxed, street-ready drape.";
        } else if (desc.includes("slim") || desc.includes("skinny")) {
          fitText = "It has a modern slim fit, tailored close to the body for a clean silhouette.";
        } else if (desc.includes("relaxed")) {
          fitText = "It features a relaxed fit, offering extra comfort and a casual drape.";
        }
        matchedAnswers.push(`**Fit Recommendation:** ${fitText}`);
      }

      // 4. SPECIFIC COLOR AVAILABILITY (WITH CROSS-RECOMMENDATION)
      if (askedColor && !colorChecked) {
        const colorVariants = (product.variants || []).filter(v => 
          Object.entries(v.attributes || {}).some(([k, val]) => k.toLowerCase() === 'color' && val.toLowerCase() === askedColor.toLowerCase())
        );
        if (colorVariants.length > 0) {
          matchedAnswers.push(`Yes, the product is available in **${askedColor.charAt(0).toUpperCase() + askedColor.slice(1)}**!`);
        } else {
          // Find other products in catalog with this color
          const otherInColor = allProducts.filter(p => 
            p._id.toString() !== product._id.toString() &&
            (p.variants || []).some(v => 
              Object.entries(v.attributes || {}).some(([k, val]) => k.toLowerCase() === 'color' && val.toLowerCase() === askedColor.toLowerCase())
            )
          );
          if (otherInColor.length > 0) {
            const list = otherInColor.slice(0, 3).map(p => `- [${p.title}](/product/${p._id}) (₹${p.price?.amount?.toLocaleString('en-IN')})`).join('\n');
            matchedAnswers.push(`No, sorry. This product is not available in **${askedColor.charAt(0).toUpperCase() + askedColor.slice(1)}** (Available colors: **${uniqueColors.join(', ') || 'None'}**).\n\nHowever, we have these other items in **${askedColor}**:\n${list}`);
          } else {
            matchedAnswers.push(`No, sorry. This product is not available in **${askedColor.charAt(0).toUpperCase() + askedColor.slice(1)}**. Available colors for this product are: **${uniqueColors.join(', ') || 'None'}**.`);
          }
        }
        colorChecked = true;
      }

      // 5. GENERAL COLOR LIST
      if (!colorChecked && (query.includes("color") || query.includes("colour") || query.includes("shade") || query.includes("hue"))) {
        if (uniqueColors.length > 0) {
          matchedAnswers.push(`**Colors:** Available in **${uniqueColors.join(', ')}**.`);
        } else {
          matchedAnswers.push(`**Colors:** Available in the primary color shown in the display images.`);
        }
      }

      // 6. MATERIAL / FABRIC
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

      // 7. STOCK & GENERAL AVAILABILITY
      if (query.includes("stock") || query.includes("quantity") || query.includes("left")) {
        const totalStock = (product.variants || []).reduce((acc, v) => acc + (v.stock || 0), product.stock || 0);
        if (totalStock <= 0) {
          matchedAnswers.push(`**Availability:** This product is currently **Out of Stock**.`);
        } else if (totalStock < 5) {
          matchedAnswers.push(`**Availability:** Only **${totalStock} items left** in stock. Grab yours before it sells out!`);
        } else {
          matchedAnswers.push(`**Availability:** Ready to ship (**${totalStock} items in stock**).`);
        }
      }

      // 8. BUDGET / PRICE LIMITS
      let budgetChecked = false;
      if (budgetLimit || query.includes("cheap") || query.includes("under") || query.includes("below") || query.includes("budget") || query.includes("low price") || query.includes("low cost")) {
        const maxPrice = budgetLimit || 1000;
        
        // Check if current product fits
        const currentPrice = product.price?.amount || 0;
        let fitsMessage = "";
        if (currentPrice > 0 && currentPrice <= maxPrice) {
          fitsMessage = `Yes! The current product **${product.title}** is priced at **₹${currentPrice.toLocaleString('en-IN')}**, which fits within your budget of **₹${maxPrice}**!\n\n`;
        } else if (currentPrice > maxPrice) {
          fitsMessage = `The current product **${product.title}** is priced at **₹${currentPrice.toLocaleString('en-IN')}**, which is above your budget of **₹${maxPrice}**.\n\n`;
        }

        // Find other products under budget
        const affordable = allProducts.filter(p => (p.price?.amount || 0) <= maxPrice);
        if (affordable.length > 0) {
          const list = affordable.slice(0, 3).map(p => `- [${p.title}](/product/${p._id}) (₹${p.price?.amount?.toLocaleString('en-IN')})`).join('\n');
          matchedAnswers.push(`${fitsMessage}Here are some items from our catalog that fit under **₹${maxPrice}**:\n${list}`);
        } else {
          const lowestProduct = allProducts.reduce((min, p) => (p.price?.amount || 0) < (min.price?.amount || Infinity) ? p : min, allProducts[0]);
          matchedAnswers.push(`${fitsMessage}I couldn't find any products in our catalog under **₹${maxPrice}**. Our lowest priced item is **${lowestProduct?.title || 'apparel'}** at **₹${lowestProduct?.price?.amount?.toLocaleString('en-IN') || '0'}**.`);
        }
        budgetChecked = true;
      }

      // 9. GENERAL PRICE
      if (!budgetChecked && (query.includes("price") || query.includes("cost") || query.includes("how much") || query.includes("rupee") || query.includes("inr"))) {
        const amt = product.price?.amount;
        matchedAnswers.push(`**Price:** It is priced at **₹${amt ? amt.toLocaleString('en-IN') : '0'}**.`);
      }

      // 10. STYLING / PAIRING
      if (query.includes("style") || query.includes("pair") || query.includes("match") || query.includes("wear with") || query.includes("look")) {
        const isTop = ['shirt', 't-shirt', 'polos'].includes(product.subCategory?.toLowerCase());
        if (isTop) {
          matchedAnswers.push(`**Styling Tip:** This top looks great when paired with casual denim, structured chinos, or modern cargos. Keep bottoms simple to emphasize the fit.`);
        } else {
          matchedAnswers.push(`**Styling Tip:** Style these bottoms with an oversized solid tee or a relaxed button-down shirt. Complete the look with clean white sneakers.`);
        }
      }

      // 11. GENERAL DETAILS / FEATURES
      if (query.includes("feature") || query.includes("detail") || query.includes("spec") || query.includes("highlight")) {
        matchedAnswers.push(`**Key Features:** ${product.title} is designed for everyday style. Highlights: ${product.description || 'Premium build quality and clean styling.'}`);
      }

      // If they ask a generic query or "tell me about this product"
      if (matchedAnswers.length === 0 && (query.includes("tell") || query.includes("about") || query.includes("what is") || query.includes("info"))) {
        const amt = product.price?.amount;
        matchedAnswers.push(`**${product.title}** is a ${product.genderCategory}'s ${product.subCategory || 'apparel'} priced at **₹${amt ? amt.toLocaleString('en-IN') : '0'}.** ${product.description || ''}`);
        if (uniqueSizes.length > 0) matchedAnswers.push(`**Sizes:** ${uniqueSizes.join(', ')}`);
      }

      // 12. CATALOG KEYWORD SEARCH
      if (matchedAnswers.length === 0 && (foundKeywords.length > 0 || query.includes("show") || query.includes("recommend") || query.includes("suggest") || query.includes("other") || query.includes("have") || query.includes("alternate"))) {
        const matches = allProducts.filter(p => {
          if (p._id.toString() === product._id.toString()) return false;
          
          const titleLower = (p.title || "").toLowerCase();
          const descLower = (p.description || "").toLowerCase();
          const catLower = (p.category || "").toLowerCase();
          const subCatLower = (p.subCategory || "").toLowerCase();
          
          if (foundKeywords.length > 0) {
            return foundKeywords.some(kw => {
              const term = kw === "tshirt" ? "t-shirt" : kw;
              const hasTerm = titleLower.includes(term) || 
                              descLower.includes(term) || 
                              catLower.includes(term) || 
                              subCatLower.includes(term);
              if (hasTerm) return true;
              
              if (kw === "gym" || kw === "running" || kw === "activewear") {
                return titleLower.includes("active") || descLower.includes("active") || descLower.includes("run") || descLower.includes("gym") || descLower.includes("training") || subCatLower.includes("activewear");
              }
              return false;
            });
          }
          return true;
        });

        if (matches.length > 0) {
          const list = matches.slice(0, 4).map(p => `- [${p.title}](/product/${p._id}) (₹${p.price?.amount?.toLocaleString('en-IN')})`).join('\n');
          matchedAnswers.push(`I found these options in our catalog:\n${list}`);
        } else {
          const popular = allProducts.filter(p => p._id.toString() !== product._id.toString()).slice(0, 3);
          if (popular.length > 0) {
            const list = popular.map(p => `- [${p.title}](/product/${p._id}) (₹${p.price?.amount?.toLocaleString('en-IN')})`).join('\n');
            matchedAnswers.push(`We don't have direct matches in the catalog right now. However, you might like these items:\n${list}`);
          }
        }
      }

      // 13. DELIVERY / SHIPPING
      if (query.includes("delivery") || query.includes("delivry") || query.includes("shipping") || query.includes("ship") || query.includes("charge")) {
        matchedAnswers.push(`**Shipping & Delivery:** We offer **free standard delivery** on all orders above **₹999**. For orders below ₹999, a nominal shipping fee is calculated at checkout.`);
      }

      // 14. DISCOUNT / OFFERS / OFF
      if (query.includes("discount") || query.includes("offer") || query.includes("coupon") || query.includes("off") || query.includes("less") || query.includes("sale") || query.includes("promo")) {
        const base = product.price?.amount || 0;
        const variants = product.variants || [];
        const discountedVariant = variants.find(v => v.price?.amount && v.price.amount < base);
        
        if (discountedVariant) {
          const discountPct = Math.round(((base - discountedVariant.price.amount) / base) * 100);
          matchedAnswers.push(`**Offers & Discounts:** Yes! Some variants of this product are currently on sale with up to **${discountPct}% OFF**!`);
        } else {
          matchedAnswers.push(`**Offers & Discounts:** We always price our luxury silhouettes at the best possible value. While we don't have a specific discount active on this product right now, you get **free delivery** on orders above ₹999!`);
        }
      }

      if (matchedAnswers.length > 0) {
        reply = matchedAnswers.join('\n\n');
      } else {
        reply = `Hi! I'm Jerry 👋, your Luomi personal shopping assistant. I can answer any questions about **${product.title}**:
- Sizes & Fit (available sizes, fit recommendation)
- Fabric & Care (materials, wash instructions)
- Colors (shades and swatches)
- Stock Status & Pricing
- Styling Suggestions

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
