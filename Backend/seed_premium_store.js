import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import productmodel from './src/models/product.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI not found in env!");
  process.exit(1);
}

const SELLER_ID = '6a16b743d83d89a4ed34db41'; // default seller (harshpatelpc2005@gmail.com)
const BASE_PUBLIC_DIR = 'c:\\Users\\harsh\\OneDrive\\Desktop\\OG_PROJECTS\\Luomi\\Frontend\\public\\images';
const PRODUCT_DIR = path.join(BASE_PUBLIC_DIR, 'products');
const CAT_DIR = path.join(BASE_PUBLIC_DIR, 'categories');
const HERO_DIR = path.join(BASE_PUBLIC_DIR, 'hero');

const CATEGORIES_DOWNLOAD = {
  shirt: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&h=1000&q=80',
  tshirts: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&h=1000&q=80',
  jeans: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&h=1000&q=80',
  trousers: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&h=1000&q=80',
  cargos: 'https://images.unsplash.com/photo-1517423568366-8b83523034fd?auto=format&fit=crop&w=800&h=1000&q=80',
  polos: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&h=1000&q=80',
  hoodies: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&h=1000&q=80',
  sweatshirts: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&h=1000&q=80',
  shorts: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=800&h=1000&q=80',
  activewear: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&h=1000&q=80'
};

const HEROES_DOWNLOAD = {
  polo: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=1600&h=900&q=80',
  denim: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1600&h=900&q=80',
  linen: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1600&h=900&q=80',
  streetwear: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&h=900&q=80',
  editorial: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1600&h=900&q=80'
};

const PRODUCTS_METADATA = [
  // 1. shirt (5 items)
  { id: 1, title: "Relaxed Fit Linen Shirt", desc: "Crafted from breathable organic linen with a camp collar. Ideal for effortless luxury resort styling.", price: 2499, gender: "men", sub: "shirt", imgId: "photo-1596755094514-f87e34085b2c", colors: ["Off-White", "Sage Green"] },
  { id: 2, title: "Cropped Poplin Shirt", desc: "Boxy silhouette in crisp organic poplin. Exaggerated collar and cuffs for a modern structural shape.", price: 2299, gender: "women", sub: "shirt", imgId: "photo-1541101767792-f9b2b1c4f127", colors: ["Sky Blue", "Stark White"] },
  { id: 3, title: "Cuban Collar Silk Shirt", desc: "Soft draped mulberry silk shirt featuring Casablanca-style tropical knit print details. Clean aesthetic.", price: 4999, gender: "men", sub: "shirt", imgId: "photo-1598033129183-c4f50c736f10", colors: ["Monogram Print", "Silk White"] },
  { id: 4, title: "Satin Draped Utility Shirt", desc: "Lustrous heavy satin utility shirt. Elegant double flap chest pockets and a fluid puddle hem.", price: 3299, gender: "women", sub: "shirt", imgId: "photo-1603252109303-2751441dd157", colors: ["Pearl White", "Onyx Black"] },
  { id: 5, title: "Oversized Flannel Shacket", desc: "Heavyweight organic cotton flannel check overshirt. Soft brushed texture, double chest utility pockets.", price: 2799, gender: "unisex", sub: "shirt", imgId: "photo-1617137968427-85924c800a22", colors: ["Forest Plaid", "Charcoal Check"] },

  // 2. t-shirt (5 items)
  { id: 6, title: "Heavyweight Boxy Tee", desc: "280 GSM premium combed cotton. Thick ribbed neckband, drop shoulders, boxy fit.", price: 1499, gender: "unisex", sub: "t-shirt", imgId: "photo-1521572267360-ee0c2909d518", colors: ["Sand Cream", "Stark White"] },
  { id: 7, title: "Acid Wash Drop-Shoulder Tee", desc: "Faded mineral wash streetwear tee. Relaxed shoulder construct and slightly distressed cuffs.", price: 1699, gender: "men", sub: "t-shirt", imgId: "photo-1583743814966-8936f5b7be1a", colors: ["Vintage Charcoal", "Stone Grey"] },
  { id: 8, title: "Minimalist Crop Rib Tee", desc: "Soft elastane cotton rib tee. Form-fitting crop structure, perfect for high-waisted layering.", price: 1199, gender: "women", sub: "t-shirt", imgId: "photo-1527719327859-c6ce802436ee", colors: ["Stark White", "Soft Sage"] },
  { id: 9, title: "Aesthetic Graphic Tee", desc: "Streetwear graphics printed in high density puff ink on organic heavyweight jersey cotton.", price: 1899, gender: "men", sub: "t-shirt", imgId: "photo-1576566588028-4147f3842f27", colors: ["Midnight Black", "Off-White"] },
  { id: 10, title: "Organic Slub Knit Tee", desc: "Lightweight, highly textured slub knit tee. Breathable feel, double stitched clean hems.", price: 1399, gender: "women", sub: "t-shirt", imgId: "photo-1554568218-0f1715e72254", colors: ["Mélange Grey", "Desert Tan"] },

  // 3. pants (4 items)
  { id: 11, title: "Wide-Leg Pleated Trousers", desc: "Relaxed fit pleated pants. Features a fluid drape, double front pleats, and a puddle wide-leg.", price: 3499, gender: "men", sub: "pants", imgId: "photo-1624378439575-d8705ad7ae80", colors: ["Sand Beige", "Slate Charcoal"] },
  { id: 12, title: "Ribbed Knit Lounge Pants", desc: "Flowy and elasticated high-rise knit pants. Cozy ribbed fabric, comfortable relaxed drape.", price: 2999, gender: "women", sub: "pants", imgId: "photo-1506794778202-cad84cf45f1d", colors: ["Espresso Brown", "Cream Oat"] },
  { id: 13, title: "Relaxed Drawstring Linen Pants", desc: "100% organic linen pants with an elastic waist and utility flat drawstrings. Airy beach comfort.", price: 3299, gender: "men", sub: "pants", imgId: "photo-1594633312681-425c7b97ccd1", colors: ["Linen White", "Marine Blue"] },
  { id: 14, title: "Split-Hem Athletic Leggings", desc: "High-stretch performance active leggings with an elegant front split hem and compression band.", price: 2599, gender: "women", sub: "pants", imgId: "photo-1492562080023-ab3db95bfbce", colors: ["Matte Black", "Cobalt Blue"] },

  // 4. cargos (4 items)
  { id: 15, title: "Parachute Cargo Trousers", desc: "Oversized tactical cargo trousers with adjustable toggle cuffs. Ultra-light nylon ripstop.", price: 3999, gender: "unisex", sub: "cargos", imgId: "photo-1517423568366-8b83523034fd", colors: ["Sage Green", "Charcoal Black"] },
  { id: 16, title: "Modular Technical Cargos", desc: "Canvas multi-pocket cargos with articulated knee panels and technical D-ring adjusters.", price: 3799, gender: "men", sub: "cargos", imgId: "photo-1551854838-212c50b4c184", colors: ["Stealth Black", "Desert Khaki"] },
  { id: 17, title: "Soft Draped Utility Cargos", desc: "Soft utility pants with oversized pockets. Comfortable elasticated back waist and fluid legs.", price: 3499, gender: "women", sub: "cargos", imgId: "photo-1479064555552-3ef4979f8908", colors: ["Chalk Ivory", "Olive Green"] },
  { id: 18, title: "Classic Canvas Combat Cargos", desc: "Heavyweight combed cotton canvas pants with deep cargo pockets and double layer knees.", price: 3699, gender: "men", sub: "cargos", imgId: "photo-1618354691373-d851c5c3a990", colors: ["Combat Khaki", "Onyx Black"] },

  // 5. polos (4 items)
  { id: 19, title: "Bouclé Knit Polo Shirt", desc: "Textured bouclé stitch retro polo. Buttonless open camp collar, extremely breathable feel.", price: 2499, gender: "men", sub: "polos", imgId: "photo-1586363104862-3a5e2ab60d99", colors: ["Cream White", "Olive Rust"] },
  { id: 20, title: "Ribbed Mercerized Polo", desc: "Luxe slim-fit polo knitted from mercerized cotton yarn. Silky luster, clean ribbed borders.", price: 2799, gender: "men", sub: "polos", imgId: "photo-1625910513397-a40026e65b53", colors: ["Olive Green", "Midnight Blue"] },
  { id: 21, title: "Cropped Ribbed Knit Polo", desc: "Preppy ribbed knit cropped polo with a sharp collar. Snug, stretch fit for an elegant silhouette.", price: 1999, gender: "women", sub: "polos", imgId: "photo-1618517351616-38fb9c5210c6", colors: ["Onyx Black", "Oatmeal Beige"] },
  { id: 22, title: "Premium Pique Cotton Polo", desc: "Fine pique knit polo with standard collar and pearl buttons. Luxurious wardrobe staple.", price: 2299, gender: "men", sub: "polos", imgId: "photo-1586363104862-3a5e2ab60d99", colors: ["Slate Grey", "Pure White"] },

  // 6. plus size (4 items)
  { id: 23, title: "Plus Oversized Canvas Shacket", desc: "Elongated loose fit heavy cotton overshirt. Relaxed shoulder construct, double button flap pockets.", price: 3299, gender: "unisex", sub: "plus size", imgId: "photo-1508214751196-bcfd4ca60f91", colors: ["Tan Canvas", "Forest Green"] },
  { id: 24, title: "Plus Flowy Satin Shirt", desc: "Elegantly draped satin shirt. Premium pearl-effect buttons, curved shirt-tail hemline.", price: 2999, gender: "women", sub: "plus size", imgId: "photo-1539571696357-5a69c17a67c6", colors: ["Emerald Green", "Burgundy Satin"] },
  { id: 25, title: "Plus Heavyweight Boxy Tee", desc: "Extra loose 300 GSM cotton tee. Ribbed crew collar, thick seams for a premium boxy hang.", price: 1799, gender: "men", sub: "plus size", imgId: "photo-1544005313-94ddf0286df2", colors: ["Midnight Black", "Washed Olive"] },
  { id: 26, title: "Plus Pleated Wide Trouser", desc: "Tailored wide-leg trousers. Double front pleating, elastic inserts on waistband for maximum comfort.", price: 3699, gender: "women", sub: "plus size", imgId: "photo-1508214751196-bcfd4ca60f91", colors: ["Steel Charcoal", "Onyx Black"] },

  // 7. trouser (4 items)
  { id: 27, title: "Smart Wool Blend Trouser", desc: "Modern slim trouser in a fine virgin wool blend. Adjustable side buckles, front crease lines.", price: 3999, gender: "men", sub: "trouser", imgId: "photo-1507679799987-c73779587ccf", colors: ["Dark Charcoal", "Soft Navy"] },
  { id: 28, title: "High-Waist Drape Trouser", desc: "Flowy, high-rise trousers with deep front pleats and fluid wide legs. Luxurious studio styling.", price: 3799, gender: "women", sub: "trouser", imgId: "photo-1492562080023-ab3db95bfbce", colors: ["Off-White", "Muted Sage"] },
  { id: 29, title: "Slim Stretch Chino Trouser", desc: "Tapered smart-casual chinos. Soft sateen stretch cotton, clean rear welt button pockets.", price: 2999, gender: "men", sub: "trouser", imgId: "photo-1594633312681-425c7b97ccd1", colors: ["Navy Blue", "Sand Stone"] },
  { id: 30, title: "Flannel Pleated Trouser", desc: "Tailored trousers in warm soft flannel. Cozy touch, sleek straight-leg structure.", price: 3599, gender: "women", sub: "trouser", imgId: "photo-1507679799987-c73779587ccf", colors: ["Taupe Mélange", "Onyx Black"] },

  // 8. jeans (4 items)
  { id: 31, title: "Japanese Selvedge Denim", desc: "14oz raw selvedge denim. Straight leg, button fly, redline selvedge cuffs. Durable luxury.", price: 4999, gender: "men", sub: "jeans", imgId: "photo-1542272604-787c3835535d", colors: ["Raw Indigo", "Dry Black"] },
  { id: 32, title: "Wide Carpenter Jeans", desc: "Relaxed cargo-denim utility pants. Hammer loops, tool pockets, clean stonewashed finish.", price: 3499, gender: "women", sub: "jeans", imgId: "photo-1541099649105-f69ad21f3246", colors: ["Light Stone Wash", "Bleached Indigo"] },
  { id: 33, title: "Slim Distressed Jeans", desc: "Stretchy slim-fit denim with subtle hand-sanded fades and minor distressing on the pockets.", price: 3299, gender: "men", sub: "jeans", imgId: "photo-1582562124811-c09040d0a901", colors: ["Medium Wash", "Vintage Grey"] },
  { id: 34, title: "High Rise Straight Jeans", desc: "Classic straight-cut denim in rigid cotton. High-waisted, elongating silhouette.", price: 2999, gender: "women", sub: "jeans", imgId: "photo-1512436991641-6745cdb1723f", colors: ["True Black", "Indigo Wash"] },

  // 9. hoodies (4 items)
  { id: 35, title: "Ultra-Heavy Boxy Hoodie", desc: "450 GSM heavyweight French Terry. Ribbed side gussets, double lined hood without drawstrings.", price: 3499, gender: "unisex", sub: "hoodies", imgId: "photo-1556821840-3a63f95609a7", colors: ["Onyx Black", "Chalk Cream"] },
  { id: 36, title: "Washed French Terry Hoodie", desc: "Acid washed hoodie with distressed edges. Kangaroo front pocket, cozy loopback interior.", price: 3299, gender: "men", sub: "hoodies", imgId: "photo-1609873814058-a8928924184a", colors: ["Vintage Grey", "Washed Plum"] },
  { id: 37, title: "Relaxed Cropped Hoodie", desc: "Cropped streetwear hoodie with flat cotton drawstrings and raw edge bottom hem.", price: 2499, gender: "women", sub: "hoodies", imgId: "photo-1556911220-e15b29be8c8f", colors: ["Sage Green", "Matte Black"] },
  { id: 38, title: "Technical Zip-Up Hoodie", desc: "Sleek scubacotton blend active zip-up. Heat-sealed zip pockets, structured fit.", price: 3899, gender: "unisex", sub: "hoodies", imgId: "photo-1544441893-675973e31985", colors: ["Stealth Black", "Carbon Grey"] },

  // 10. shorts (4 items)
  { id: 39, title: "Linen Drawstring Shorts", desc: "Lightweight, breathable linen-blend shorts with elastic waistband and flat drawstrings.", price: 1999, gender: "men", sub: "shorts", imgId: "photo-1591195853828-11db59a44f6b", colors: ["Ecrù Sand", "Navy Blue"] },
  { id: 40, title: "Heavy Fleece Lounge Shorts", desc: "Extra soft, dense fleece shorts with raw cut hems and deep side hand pockets.", price: 1799, gender: "unisex", sub: "shorts", imgId: "photo-1519242220831-09410926fbff", colors: ["Heather Grey", "Pure Black"] },
  { id: 41, title: "Tailored Pleated Shorts", desc: "Smart high-waisted pleated dress shorts. Seamless front closure, side slide pockets.", price: 2299, gender: "women", sub: "shorts", imgId: "photo-1604176354204-9268737828e4", colors: ["Beige Dune", "Onyx Black"] },
  { id: 42, title: "Utility Combat Cargo Shorts", desc: "Cotton canvas cargo shorts with tactical webbing side adjusters and snap flap pockets.", price: 2499, gender: "men", sub: "shorts", imgId: "photo-1560243563-062bff001d68", colors: ["Military Olive", "Camel Sand"] },

  // 11. activewear (5 items)
  { id: 43, title: "Technical Trail Windbreaker", desc: "Waterproof ripstop wind jacket. Drawstring storm hood, heat-welded seams, back ventilation.", price: 4499, gender: "men", sub: "activewear", imgId: "photo-1517838277536-f5f99be501cd", colors: ["Stealth Black", "Cobalt Blue"] },
  { id: 44, title: "Sculpt Compression Leggings", desc: "Sweat-wicking interlock knit leggings. Supportive high-rise waistband, invisible side phone pocket.", price: 2999, gender: "women", sub: "activewear", imgId: "photo-1476480862126-209bfaa8edc8", colors: ["Matte Black", "Forest Green"] },
  { id: 45, title: "Reflective Training Vest", desc: "Breathable performance mesh training vest with 360 reflective high-visibility details.", price: 2299, gender: "unisex", sub: "activewear", imgId: "photo-1483985988355-763728e1935b", colors: ["Neon Grey", "Core Black"] },
  { id: 46, title: "Dry Fit Support Sports Bra", desc: "Medium support sports bra in a smooth double-knit fabric. Strappy cross-back design.", price: 1899, gender: "women", sub: "activewear", imgId: "photo-1485968579580-b6d095142e6e", colors: ["Sage Green", "Berry Wine"] },
  { id: 47, title: "Technical Running Joggers", desc: "Slim-fit running pants with zipped ankle cuffs and ergonomic dry-fit paneling.", price: 3299, gender: "men", sub: "activewear", imgId: "photo-1518310383802-640c2de311b2", colors: ["Charcoal Grey", "Core Black"] },

  // 12. sweatshirts (5 items)
  { id: 48, title: "Oversized Crewneck Sweatshirt", desc: "380 GSM organic cotton crewneck. Drop-shoulders, thick ribbed cuffs and neck band.", price: 2799, gender: "unisex", sub: "sweatshirts", imgId: "photo-1620799140408-edc6dcb6d633", colors: ["Chalk Cream", "Sage Grey"] },
  { id: 49, title: "Mock-Neck Ribbed Sweatshirt", desc: "Semi-formal mock-neck sweatshirt in dense interlock cotton. Elegant ribbed stand collar.", price: 2999, gender: "men", sub: "sweatshirts", imgId: "photo-1556821840-3a63f95609a7", colors: ["Mélange Grey", "Classic Black"] },
  { id: 50, title: "Quarter-Zip Pullover", desc: "Plush cotton-fleece half-zip sweatshirt. Stand-up collar, silver metal zipper puller.", price: 3299, gender: "women", sub: "sweatshirts", imgId: "photo-1556911220-e15b29be8c8f", colors: ["Sand Dune", "Pure White"] },
  { id: 51, title: "Vintage Washed Sweatshirt", desc: "Heavyweight pigment dyed sweatshirt. Faded seams and soft worn-in texture.", price: 2899, gender: "unisex", sub: "sweatshirts", imgId: "photo-1543163521-1bf539c55dd2", colors: ["Vintage Plum", "Faded Slate"] },
  { id: 52, title: "Raglan Fleece Pullover", desc: "Classic sporty raglan sleeve sweatshirt. Cozy fleece lining, comfortable relaxed fit.", price: 2699, gender: "men", sub: "sweatshirts", imgId: "photo-1523381210434-271e8be1f52b", colors: ["Deep Navy", "Crimson Red"] }
];

async function downloadImage(url, destPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.promises.writeFile(destPath, buffer);
  } catch (error) {
    throw new Error(`Failed to download ${url}: ${error.message}`);
  }
}

async function downloadAll(items, limit) {
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const myIndex = index++;
      const item = items[myIndex];
      try {
        await downloadImage(item.url, item.dest);
        console.log(`[${myIndex + 1}/${items.length}] ✓ Downloaded ${path.basename(item.dest)}`);
      } catch (e) {
        console.error(`[${myIndex + 1}/${items.length}] ✗ Failed ${item.url}: ${e.message}`);
        // Simple retry once
        try {
          console.log(`[${myIndex + 1}/${items.length}] ↻ Retrying ${path.basename(item.dest)}...`);
          await downloadImage(item.url, item.dest);
          console.log(`[${myIndex + 1}/${items.length}] ✓ Downloaded ${path.basename(item.dest)} (after retry)`);
        } catch (e2) {
          console.error(`[${myIndex + 1}/${items.length}] ✗ Failed retry: ${e2.message}`);
        }
      }
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
}

async function run() {
  // 1. Create target directories
  [PRODUCT_DIR, CAT_DIR, HERO_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });

  // 2. Prepare all download tasks
  const downloadQueue = [];

  // Category Banners
  for (const [name, url] of Object.entries(CATEGORIES_DOWNLOAD)) {
    downloadQueue.push({ url, dest: path.join(CAT_DIR, `${name}.jpg`) });
  }

  // Hero Banners
  for (const [name, url] of Object.entries(HEROES_DOWNLOAD)) {
    downloadQueue.push({ url, dest: path.join(HERO_DIR, `${name}.jpg`) });
  }

  // Product Images (Image 1 and Image 2 from same photoshoot with different crop layouts)
  for (const prod of PRODUCTS_METADATA) {
    const isBottom = ['pants', 'trouser', 'jeans', 'shorts', 'cargos'].includes(prod.sub);
    const cropLayout = isBottom ? 'bottom' : 'top';

    const url1 = `https://images.unsplash.com/${prod.imgId}?auto=format&fit=crop&w=800&h=1000&q=80`;
    const url2 = `https://images.unsplash.com/${prod.imgId}?auto=format&fit=crop&w=800&h=1000&q=80&crop=${cropLayout}`;

    downloadQueue.push({ url: url1, dest: path.join(PRODUCT_DIR, `prod_${prod.id}_1.jpg`) });
    downloadQueue.push({ url: url2, dest: path.join(PRODUCT_DIR, `prod_${prod.id}_2.jpg`) });
  }

  console.log(`Starting download queue: ${downloadQueue.length} assets...`);
  await downloadAll(downloadQueue, 16);
  console.log("✓ Assets download phase completed.");

  // 3. Connect and Seed MongoDB
  console.log("Connecting to MongoDB for seeding 52 products...");
  await mongoose.connect(MONGO_URI);

  const CartSchema = new mongoose.Schema({}, { strict: false });
  const Cart = mongoose.model('carts', CartSchema);

  const WishlistSchema = new mongoose.Schema({}, { strict: false });
  const Wishlist = mongoose.model('wishlists', WishlistSchema);

  const OrderSchema = new mongoose.Schema({}, { strict: false });
  const Order = mongoose.model('orders', OrderSchema);

  console.log("Wiping collections...");
  await productmodel.deleteMany({});
  await Cart.deleteMany({});
  await Wishlist.deleteMany({});
  await Order.deleteMany({});
  console.log("✓ Collections wiped.");

  console.log("Preparing product database insertion...");
  const finalProducts = PRODUCTS_METADATA.map(p => {
    const mainImgUrl = `/images/products/prod_${p.id}_1.jpg`;
    const altImgUrl = `/images/products/prod_${p.id}_2.jpg`;

    // Size variants
    const sizes = p.sub === 'plus size' ? ['2XL', '3XL', '4XL', '5XL'] : ['S', 'M', 'L', 'XL'];
    const variants = [];

    // Construct variants with sizes and colors
    p.colors.forEach(col => {
      sizes.forEach(sz => {
        variants.push({
          attributes: { size: sz, color: col },
          stock: Math.floor(Math.random() * 15) + 5, // 5 to 20 stock per variant
          price: { amount: p.price, currency: "INR" },
          images: [{ url: mainImgUrl }, { url: altImgUrl }]
        });
      });
    });

    return {
      title: p.title,
      description: p.desc,
      images: [{ url: mainImgUrl }, { url: altImgUrl }],
      price: { amount: p.price, currency: "INR" },
      stock: variants.reduce((sum, v) => sum + v.stock, 0),
      variants,
      genderCategory: p.gender,
      subCategory: p.sub,
      seller: new mongoose.Types.ObjectId(SELLER_ID)
    };
  });

  console.log(`Inserting ${finalProducts.length} premium products...`);
  const result = await productmodel.insertMany(finalProducts);
  console.log(`✓ Database seeded successfully. Registered ${result.length} products.`);

  await mongoose.disconnect();
}

run().catch(console.error);
