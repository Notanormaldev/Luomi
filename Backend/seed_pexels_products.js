import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import productmodel from './src/models/product.model.js';
import usermodel from './src/models/user.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not found in env!");
  process.exit(1);
}

const SELLER_ID = '6a16b743d83d89a4ed34db41'; // default seller (harshpatelpc2005@gmail.com)

const PRODUCTS_DATA = {
  'shirt': [
    { title: "Relaxed Fit Linen Shirt", desc: "Crafted from breathable organic linen with a camp collar. Ideal for effortless luxury resort styling.", price: 2499 },
    { title: "Classic Chambray Button-Up", desc: "A timeless indigo chambray shirt with double chest pockets and a clean tapered silhouette.", price: 2299 },
    { title: "Oxford Cotton Tailored Shirt", desc: "Premium heavyweight Oxford cotton button-down shirt. Clean collar shape, perfect for smart-casual wear.", price: 2599 },
    { title: "Cropped Poplin Shirt", desc: "Boxy silhouette in crisp organic poplin. Exaggerated collar and cuffs for a modern structural shape.", price: 2199 },
    { title: "Satin Draped Utility Shirt", desc: "Lustrous heavy satin utility shirt. Elegant double flap chest pockets and a fluid puddle hem.", price: 3299 },
    { title: "Silk Camp Collar Shirt", desc: "Soft draped mulberry silk shirt featuring retro-inspired knit details and a clean camp collar.", price: 4999 },
    { title: "Kids Organic Cotton Shirt", desc: "Ultra-soft combed organic cotton shirt for everyday comfort. Features durable stitching.", price: 1299 },
    { title: "Kids Soft Flannel Shirt", desc: "Warm and cozy brushed flannel shirt in a colorful check pattern. Features snap buttons.", price: 1499 },
    { title: "Oversized Flannel Shacket", desc: "Heavyweight organic cotton flannel check overshirt. Soft brushed texture, double chest utility pockets.", price: 2799 },
    { title: "Structured Denim Shirt Jacket", desc: "Rigid denim shacket with clean stitch detailing, serving as a versatile layering piece.", price: 2999 }
  ],
  't-shirt': [
    { title: "Acid Wash Drop-Shoulder Tee", desc: "Faded mineral wash streetwear tee. Relaxed shoulder construct and slightly distressed cuffs.", price: 1699 },
    { title: "Aesthetic Graphic Tee", desc: "Streetwear graphics printed in high density puff ink on organic heavyweight jersey cotton.", price: 1899 },
    { title: "Essential Crewneck Tee", desc: "Clean everyday crewneck t-shirt crafted from soft, long-staple organic cotton.", price: 999 },
    { title: "Minimalist Crop Rib Tee", desc: "Soft elastane cotton rib tee. Form-fitting crop structure, perfect for high-waisted layering.", price: 1199 },
    { title: "Organic Slub Knit Tee", desc: "Lightweight, highly textured slub knit tee. Breathable feel, double stitched clean hems.", price: 1399 },
    { title: "Boxy Fit Tee", desc: "Modern boxy silhouette tee with drop shoulders and a heavy ribbed neckband.", price: 1499 },
    { title: "Kids Soft Jersey Tee", desc: "Breathable and ultra-soft jersey cotton tee, designed for daily play and movement.", price: 799 },
    { title: "Kids Graphic Crew Tee", desc: "Fun and vibrant graphic print crewneck tee in a durable pre-washed cotton fabric.", price: 899 },
    { title: "Heavyweight Boxy Tee", desc: "280 GSM premium combed cotton. Thick ribbed neckband, drop shoulders, boxy fit.", price: 1499 },
    { title: "Vintage Wash Pocket Tee", desc: "Soft pigment-dyed tee with a chest pocket and vintage-inspired faded seams.", price: 1599 }
  ],
  'pants': [
    { title: "Wide-Leg Pleated Trousers", desc: "Relaxed fit pleated pants. Features a fluid drape, double front pleats, and a puddle wide-leg.", price: 3499 },
    { title: "Relaxed Drawstring Linen Pants", desc: "100% organic linen pants with an elastic waist and utility flat drawstrings. Airy beach comfort.", price: 3299 },
    { title: "Smart Tailored Dress Pants", desc: "Sleek tailored pants in a wool blend. Features side adjusters and sharp pressed creases.", price: 3799 },
    { title: "Ribbed Knit Lounge Pants", desc: "Flowy and elasticated high-rise knit pants. Cozy ribbed fabric, comfortable relaxed drape.", price: 2999 },
    { title: "High-Waist Drape Pants", desc: "Elegant high-rise pants featuring a fluid drape, front pleats, and wide legs.", price: 3199 },
    { title: "Wide-Leg Linen Pants", desc: "Flowy organic linen pants with an elastic waist and clean side slide pockets.", price: 2799 },
    { title: "Kids Cozy Jogger Pants", desc: "Super soft fleece joggers with elastic cuffs and drawstring waist for play-all-day comfort.", price: 1199 },
    { title: "Kids Cotton Twill Pants", desc: "Durable and breathable cotton twill pants with adjustable inner waistbands.", price: 1499 },
    { title: "Technical Parachute Pants", desc: "Oversized tactical pants with adjustable toggle hems and elastic waistband. Lightweight ripstop.", price: 3999 },
    { title: "Oversized Sweatpants", desc: "Heavyweight French Terry sweatpants with a relaxed, slouchy fit and cozy brushed backing.", price: 2899 }
  ],
  'cargos': [
    { title: "Modular Technical Cargos", desc: "Canvas multi-pocket cargos with articulated knee panels and technical D-ring adjusters.", price: 3799 },
    { title: "Classic Canvas Combat Cargos", desc: "Heavyweight combed cotton canvas pants with deep cargo pockets and double layer knees.", price: 3699 },
    { title: "Slim Fit Cargo Pants", desc: "Tapered utility cargo pants with clean side pockets and a durable stretch twill finish.", price: 3299 },
    { title: "Soft Draped Utility Cargos", desc: "Soft utility pants with oversized pockets. Comfortable elasticated back waist and fluid legs.", price: 3499 },
    { title: "High Rise Cargo Joggers", desc: "Sporty cargo pants with elastic cuffs and a high-rise waist. Made from lightweight cotton.", price: 2999 },
    { title: "Wide Leg Cargo Pants", desc: "Modern relaxed wide-leg cargos featuring large utility pockets and a mid-rise fit.", price: 3599 },
    { title: "Kids Ripstop Cargo Pants", desc: "Rugged ripstop utility pants with easy-to-reach pockets, built for active kids.", price: 1699 },
    { title: "Kids Multi-Pocket Cargos", desc: "Durable twill cargo pants with functional side pockets and elastic waist utility.", price: 1899 },
    { title: "Parachute Cargo Trousers", desc: "Oversized tactical cargo trousers with adjustable toggle cuffs. Ultra-light nylon ripstop.", price: 3999 },
    { title: "Utility Relaxed Cargos", desc: "Relaxed fit cargo pants with deep utility pockets and comfortable canvas build.", price: 3399 }
  ],
  'polos': [
    { title: "Bouclé Knit Polo Shirt", desc: "Textured bouclé stitch retro polo. Buttonless open camp collar, extremely breathable feel.", price: 2499 },
    { title: "Ribbed Mercerized Polo", desc: "Luxe slim-fit polo knitted from mercerized cotton yarn. Silky luster, clean ribbed borders.", price: 2799 },
    { title: "Premium Pique Cotton Polo", desc: "Fine pique knit polo with standard collar and pearl buttons. Luxurious wardrobe staple.", price: 2299 },
    { title: "Cropped Ribbed Knit Polo", desc: "Preppy ribbed knit cropped polo with a sharp collar. Snug, stretch fit for an elegant silhouette.", price: 1999 },
    { title: "Slim Fit Pique Polo", desc: "Classic athletic polo in a stretchy pique knit, featuring a neat two-button placket.", price: 1899 },
    { title: "Open Collar Knit Polo", desc: "Textured knit polo with a modern flat collar and a relaxed drape, perfect for warm weather.", price: 2399 },
    { title: "Kids Classic Cotton Polo", desc: "Soft and breathable cotton pique polo, perfect for smart occasions and playground comfort.", price: 1099 },
    { title: "Kids Striped Pique Polo", desc: "Durable striped cotton polo featuring a ribbed collar and classic two-button placket.", price: 1199 },
    { title: "Oversized Vintage Polo", desc: "Relaxed-fit heavyweight polo with a retro color-block collar and vintage wash.", price: 2099 },
    { title: "Athletic Zip-Neck Polo", desc: "Moisture-wicking active polo shirt with a clean zip-neck closure and sporty fit.", price: 2199 }
  ],
  'plus size': [
    { title: "Plus Heavyweight Boxy Tee", desc: "Extra loose 300 GSM cotton tee. Ribbed crew collar, thick seams for a premium boxy hang.", price: 1799 },
    { title: "Plus Utility Flannel Shirt", desc: "Generous fit brushed cotton flannel check shirt with dual chest pockets and relaxed shoulders.", price: 2999 },
    { title: "Plus Smart Chino Pants", desc: "Comfortable straight-leg chinos with an elasticated waistband and durable stretch twill.", price: 3299 },
    { title: "Plus Flowy Satin Shirt", desc: "Elegantly draped satin shirt. Premium pearl-effect buttons, curved shirt-tail hemline.", price: 2999 },
    { title: "Plus Pleated Wide Trouser", desc: "Tailored wide-leg trousers. Double front pleating, elastic inserts on waistband for maximum comfort.", price: 3699 },
    { title: "Plus Ribbed Knit Dress", desc: "A beautifully draped, stretch-fit ribbed knit dress that flatters all curves with style.", price: 3499 },
    { title: "Kids Comfort Fit Denim", desc: "Roomy denim jeans with an adjustable waistband, designed for children needing extra comfort.", price: 1699 },
    { title: "Kids Loose Cotton Tee", desc: "Oversized and comfortable organic cotton tee, offering a relaxed and breathable fit.", price: 1299 },
    { title: "Plus Oversized Canvas Shacket", desc: "Elongated loose fit heavy cotton overshirt. Relaxed shoulder construct, double button flap pockets.", price: 3299 },
    { title: "Plus Heavy Fleece Hoodie", desc: "Premium heavy fleece hoodie designed for a cozy, oversized fit with maximum warmth.", price: 3899 }
  ],
  'trouser': [
    { title: "Smart Wool Blend Trouser", desc: "Modern slim trouser in a fine virgin wool blend. Adjustable side buckles, front crease lines.", price: 3999 },
    { title: "Slim Stretch Chino Trouser", desc: "Tapered smart-casual chinos. Soft sateen stretch cotton, clean rear welt button pockets.", price: 2999 },
    { title: "Classic Pleated Dress Trouser", desc: "Timeless trousers with sharp double pleats, side adjusters, and a premium drape.", price: 3599 },
    { title: "High-Waist Drape Trouser", desc: "Flowy, high-rise trousers with deep front pleats and fluid wide legs. Luxurious studio styling.", price: 3799 },
    { title: "Flannel Pleated Trouser", desc: "Tailored trousers in warm soft flannel. Cozy touch, sleek straight-leg structure.", price: 3599 },
    { title: "Straight Leg Tailored Trouser", desc: "Clean tailored trousers with straight legs, slide pockets, and comfortable stretch fabric.", price: 3199 },
    { title: "Kids Smart Twill Trouser", desc: "Sharp-looking twill trousers with a comfy elastic waist, perfect for formal events.", price: 1599 },
    { title: "Kids Elastic Waist Trouser", desc: "Soft cotton-mix trousers with an easy pull-on waistband, built for kid-friendly ease.", price: 1499 },
    { title: "Relaxed Drawstring Trouser", desc: "Comfy wide-leg trousers featuring an elastic waist and soft linen-blend texture.", price: 2999 },
    { title: "Modern Crop Trouser", desc: "Slightly cropped tailored trousers with tapered legs, offering a modern smart aesthetic.", price: 3299 }
  ],
  'jeans': [
    { title: "Japanese Selvedge Denim", desc: "14oz raw selvedge denim. Straight leg, button fly, redline selvedge cuffs. Durable luxury.", price: 4999 },
    { title: "Slim Distressed Jeans", desc: "Stretchy slim-fit denim with subtle hand-sanded fades and minor distressing on the pockets.", price: 3299 },
    { title: "Classic Straight Fit Jeans", desc: "Rigid dark indigo denim with straight legs and a traditional 5-pocket design.", price: 2999 },
    { title: "Wide Carpenter Jeans", desc: "Relaxed cargo-denim utility pants. Hammer loops, tool pockets, clean stonewashed finish.", price: 3499 },
    { title: "High Rise Straight Jeans", desc: "Classic straight-cut denim in rigid cotton. High-waisted, elongating silhouette.", price: 2999 },
    { title: "Flares Vintage Wash Jeans", desc: "Retro-inspired flared jeans with a flattering high rise and authentic faded wash.", price: 3199 },
    { title: "Kids Stretch Denim Jeans", desc: "Super-stretchy denim jeans with an adjustable waistband, built to withstand playground fun.", price: 1899 },
    { title: "Kids Elastic Waist Denim", desc: "Easy pull-on denim pants with a soft elastic waistband and comfortable relaxed fit.", price: 1699 },
    { title: "Oversized Carpenter Jeans", desc: "Slouchy utility jeans featuring carpenter pockets, loose legs, and heavy cotton build.", price: 3799 },
    { title: "Relaxed Fit Denim Pants", desc: "Comfortable mid-wash denim jeans with a relaxed fit through the thighs and legs.", price: 2899 }
  ],
  'hoodies': [
    { title: "Washed French Terry Hoodie", desc: "Acid washed hoodie with distressed edges. Kangaroo front pocket, cozy loopback interior.", price: 3299 },
    { title: "Classic Pullover Fleece Hoodie", desc: "Soft brushed fleece hoodie with adjustable drawstrings and a snug kangaroo pocket.", price: 2799 },
    { title: "Full-Zip Athletic Hoodie", desc: "Premium dry-fit zip hoodie with zip pockets and a sleek structured hood.", price: 3499 },
    { title: "Relaxed Cropped Hoodie", desc: "Cropped streetwear hoodie with flat cotton drawstrings and raw edge bottom hem.", price: 2499 },
    { title: "Oversized Plush Hoodie", desc: "Extremely soft and thick fleece hoodie with a double-layered hood and relaxed drape.", price: 2999 },
    { title: "Soft Knit Zip Hoodie", desc: "Fine-knit lightweight hoodie with a zip front, offering a smart-casual layering piece.", price: 3199 },
    { title: "Kids Cozy Fleece Hoodie", desc: "Warm fleece hoodie with a soft lining and fun colors, perfect for colder days.", price: 1599 },
    { title: "Kids Graphic Hoodie", desc: "Comfortable cotton hoodie featuring a playful graphic print and durable cuffs.", price: 1799 },
    { title: "Ultra-Heavy Boxy Hoodie", desc: "450 GSM heavyweight French Terry. Ribbed side gussets, double lined hood without drawstrings.", price: 3499 },
    { title: "Technical Zip-Up Hoodie", desc: "Sleek scubacotton blend active zip-up. Heat-sealed zip pockets, structured fit.", price: 3899 }
  ],
  'shorts': [
    { title: "Linen Drawstring Shorts", desc: "Lightweight, breathable linen-blend shorts with elastic waistband and flat drawstrings.", price: 1999 },
    { title: "Utility Combat Cargo Shorts", desc: "Cotton canvas cargo shorts with tactical webbing side adjusters and snap flap pockets.", price: 2499 },
    { title: "Chino Summer Shorts", desc: "Classic tailored chino shorts in lightweight cotton twill, featuring a clean front.", price: 1899 },
    { title: "Tailored Pleated Shorts", desc: "Smart high-waisted pleated dress shorts. Seamless front closure, side slide pockets.", price: 2299 },
    { title: "High Rise Denim Shorts", desc: "High-waisted raw edge denim shorts with classic 5-pocket detailing and vintage fade.", price: 2099 },
    { title: "Cozy Knit Lounge Shorts", desc: "Super soft ribbed knit shorts with an elastic waist, perfect for comfortable lounging.", price: 1799 },
    { title: "Kids Soft Cotton Shorts", desc: "Lightweight cotton shorts with an elastic drawstring waist for easy wearing.", price: 999 },
    { title: "Kids Active Mesh Shorts", desc: "Breathable and quick-drying athletic mesh shorts, built for sports and play.", price: 1099 },
    { title: "Heavy Fleece Lounge Shorts", desc: "Extra soft, dense fleece shorts with raw cut hems and deep side hand pockets.", price: 1799 },
    { title: "Classic Nylon Board Shorts", desc: "Water-repellent nylon swim shorts with a mesh lining and comfortable elastic waist.", price: 1599 }
  ],
  'activewear': [
    { title: "Technical Trail Windbreaker", desc: "Waterproof ripstop wind jacket. Drawstring storm hood, heat-welded seams, back ventilation.", price: 4499 },
    { title: "Technical Running Joggers", desc: "Slim-fit running pants with zipped ankle cuffs and ergonomic dry-fit paneling.", price: 3299 },
    { title: "Dry Fit Athletic Tee", desc: "Breathable and moisture-wicking training shirt in a lightweight performance polyester.", price: 1799 },
    { title: "Sculpt Compression Leggings", desc: "Sweat-wicking interlock knit leggings. Supportive high-rise waistband, invisible side phone pocket.", price: 2999 },
    { title: "Dry Fit Support Sports Bra", desc: "Medium support sports bra in a smooth double-knit fabric. Strappy cross-back design.", price: 1899 },
    { title: "Mesh Back Training Tank", desc: "Lightweight workout tank top featuring a breathable mesh back panel to keep you cool.", price: 1599 },
    { title: "Kids Quick-Dry Track Jacket", desc: "Sporty zip-up track jacket in a shiny, durable active fabric with zip pockets.", price: 1999 },
    { title: "Kids Performance Leggings", desc: "Stretchy, moisture-wicking leggings built for gymnastics, sports, or active play.", price: 1499 },
    { title: "Reflective Training Vest", desc: "Breathable performance mesh training vest with 360 reflective high-visibility details.", price: 2299 },
    { title: "All-Weather Packable Anorak", desc: "Lightweight and wind-resistant pullover jacket that packs neatly into its own pocket.", price: 2799 }
  ],
  'sweatshirts': [
    { title: "Mock-Neck Ribbed Sweatshirt", desc: "Semi-formal mock-neck sweatshirt in dense interlock cotton. Elegant ribbed stand collar.", price: 2999 },
    { title: "Raglan Fleece Pullover", desc: "Classic sporty raglan sleeve sweatshirt. Cozy fleece lining, comfortable relaxed fit.", price: 2699 },
    { title: "Classic Crewneck Sweatshirt", desc: "Durable organic cotton crewneck sweatshirt with ribbed trims and a soft brushed interior.", price: 2499 },
    { title: "Quarter-Zip Pullover", desc: "Plush cotton-fleece half-zip sweatshirt. Stand-up collar, silver metal zipper puller.", price: 3299 },
    { title: "Oversized Drop-Shoulder Sweatshirt", desc: "Slouchy oversized sweatshirt with dropped shoulders and a heavy cozy feel.", price: 2899 },
    { title: "Cropped Crewneck Sweatshirt", desc: "Trendy cropped sweatshirt in a soft cotton loopback fleece, with matching ribbed hems.", price: 2399 },
    { title: "Kids Soft Fleece Crew", desc: "Super cozy crewneck sweatshirt, designed to keep kids warm and comfortable all day.", price: 1299 },
    { title: "Kids Hoodless Sweatshirt", desc: "Durable and soft pull-on sweatshirt in solid fun colors, perfect for school or play.", price: 1499 },
    { title: "Oversized Crewneck Sweatshirt", desc: "380 GSM organic cotton crewneck. Drop-shoulders, thick ribbed cuffs and neck band.", price: 2799 },
    { title: "Vintage Washed Sweatshirt", desc: "Heavyweight pigment dyed sweatshirt. Faded seams and soft worn-in texture.", price: 2899 }
  ]
};

function getGenderForIndex(idx) {
  if (idx < 3) return 'men';
  if (idx < 6) return 'women';
  if (idx < 8) return 'kids';
  return 'unisex';
}

const COLORS = [
  ["Off-White", "Charcoal Grey"],
  ["Slate Blue", "Oatmeal Beige"],
  ["Stealth Black", "Sage Green"],
  ["Desert Sand", "Classic Navy"],
  ["Burgundy", "Heather Grey"]
];

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB");

  // Models definitions for Wipe
  const CartSchema = new mongoose.Schema({}, { strict: false });
  const Cart = mongoose.models.carts || mongoose.model('carts', CartSchema);

  const WishlistSchema = new mongoose.Schema({}, { strict: false });
  const Wishlist = mongoose.models.wishlists || mongoose.model('wishlists', WishlistSchema);

  const OrderSchema = new mongoose.Schema({}, { strict: false });
  const Order = mongoose.models.orders || mongoose.model('orders', OrderSchema);

  // 1. Wipe collections to avoid invalid/cheap references
  console.log("Wiping collections...");
  await productmodel.deleteMany({});
  await Cart.deleteMany({});
  await Wishlist.deleteMany({});
  await Order.deleteMany({});
  console.log("✓ Collections wiped.");

  // 2. Ensure seller user exists
  let seller = await usermodel.findById(SELLER_ID);
  if (!seller) {
    console.log(`Seller user with ID ${SELLER_ID} not found. Creating a default seller...`);
    seller = await usermodel.create({
      _id: SELLER_ID,
      fullname: "Harsh Patel",
      email: "harshpatelpc2005@gmail.com",
      // default bcrypt hash for "password"
      password: "$2a$10$iN48D/wZ.vG8eJ8P5qUqfuzw9kFmF6yO9a/R9wV9f9f9f9f9f9f9f",
      role: "seller",
      isverified: true,
      address: "123 Atelier Street",
      city: "Mumbai",
      pincode: "400001",
      contact: "9876543210"
    });
    console.log("✓ Default seller user registered successfully.");
  } else {
    console.log(`✓ Default seller user exists: ${seller.fullname}`);
  }

  // 3. Load Pexels Images JSON
  const imagesPath = path.join(process.cwd(), 'pexels_images.json');
  if (!fs.existsSync(imagesPath)) {
    throw new Error(`Pexels images file not found at ${imagesPath}. Please run fetch_pexels_images.js first.`);
  }

  const pexelsData = JSON.parse(fs.readFileSync(imagesPath, 'utf-8'));
  console.log(`Loaded ${pexelsData.length} category combinations from ${imagesPath}`);

  // Helper to find images for subCategory and genderCategory
  function getPexelsImages(subCat, genderCat) {
    const entry = pexelsData.find(item => 
      item.subCategory.toLowerCase() === subCat.toLowerCase() && 
      item.genderCategory.toLowerCase() === genderCat.toLowerCase()
    );
    return entry && entry.images ? entry.images : [];
  }

  const productsToInsert = [];

  // 4. Generate 10 products per subCategory
  for (const [subCat, list] of Object.entries(PRODUCTS_DATA)) {
    console.log(`Generating 10 products for subCategory: "${subCat}"...`);
    
    for (let i = 0; i < 10; i++) {
      const prodMeta = list[i];
      const genderCat = getGenderForIndex(i);
      const categoryImages = getPexelsImages(subCat, genderCat);

      if (categoryImages.length === 0) {
        console.warn(`WARNING: No Pexels images found for ${genderCat} ${subCat}. Using placeholder.`);
      }

      // We select 2 images for the product (main & hover)
      // Since we need 3 products for 'men' but only have 5 images, we pair them using wrapping logic
      // e.g. i=0 uses img 0 & 1, i=1 uses img 2 & 3, i=2 uses img 4 & 0
      const imgCount = categoryImages.length;
      let productImages = [];
      if (imgCount > 0) {
        const idx1 = (i * 2) % imgCount;
        const idx2 = (i * 2 + 1) % imgCount;
        
        const mainImg = categoryImages[idx1];
        const hoverImg = categoryImages[idx2] || mainImg;
        
        productImages = [
          { url: mainImg.url },
          { url: hoverImg.url }
        ];
      } else {
        // Fallback placeholder
        productImages = [
          { url: "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" },
          { url: "https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" }
        ];
      }

      // Sizes
      const sizes = subCat === 'plus size' ? ['2XL', '3XL', '4XL', '5XL'] : ['S', 'M', 'L', 'XL'];
      // Select a color pair for this product based on index
      const colorPair = COLORS[i % COLORS.length];

      // Variants construction
      const variants = [];
      colorPair.forEach(col => {
        sizes.forEach(sz => {
          variants.push({
            attributes: { size: sz, color: col },
            stock: Math.floor(Math.random() * 16) + 5, // 5 to 20 stock per variant
            price: { amount: prodMeta.price, currency: "INR" },
            images: productImages
          });
        });
      });

      const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

      productsToInsert.push({
        title: prodMeta.title,
        description: prodMeta.desc,
        images: productImages,
        price: { amount: prodMeta.price, currency: "INR" },
        stock: totalStock,
        variants: variants,
        genderCategory: genderCat,
        subCategory: subCat,
        seller: new mongoose.Types.ObjectId(SELLER_ID)
      });
    }
  }

  console.log(`Inserting ${productsToInsert.length} brand new products into database...`);
  const results = await productmodel.insertMany(productsToInsert);
  console.log(`✓ Successfully seeded database with ${results.length} products!`);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

seed().catch(console.error);
