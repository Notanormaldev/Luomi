import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const PEXEL_API_KEY = process.env.PEXEL_API_KEY || process.env.PEXELS_API_KEY;
if (!PEXEL_API_KEY) {
  console.error("Error: PEXEL_API_KEY not found in environment variables.");
  process.exit(1);
}

const GENDER_CATEGORIES = ['men', 'women', 'kids', 'unisex'];
const SUB_CATEGORIES = [
  'shirt', 't-shirt', 'pants', 'cargos', 'polos', 
  'plus size', 'trouser', 'jeans', 'hoodies', 
  'shorts', 'activewear', 'sweatshirts'
];

// Helper to delay execution to respect rate limits
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPhotosFromPexels(query, targetCount = 5) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`;
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': PEXEL_API_KEY
      }
    });

    if (!response.ok) {
      console.error(`Pexels API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    if (!data.photos || data.photos.length === 0) {
      return [];
    }

    // Filter photos based on requirements:
    // 1. Min width 1000px
    // 2. Do NOT use Unsplash (Pexels doesn't host Unsplash, but we double-check image URLs just in case)
    const filtered = data.photos
      .filter(photo => {
        const meetsWidth = photo.width >= 1000;
        const notUnsplash = !photo.url.includes('unsplash.com') && !photo.src.original.includes('unsplash.com');
        return meetsWidth && notUnsplash;
      })
      .map(photo => ({
        url: photo.src.large2x || photo.src.original,
        photographer: photo.photographer,
        pexels_url: photo.url
      }));

    return filtered.slice(0, targetCount);
  } catch (error) {
    console.error(`Failed to fetch query "${query}":`, error.message);
    return [];
  }
}

async function run() {
  console.log("Starting Pexels product images collection...");
  const results = [];

  for (const subCat of SUB_CATEGORIES) {
    for (const genderCat of GENDER_CATEGORIES) {
      console.log(`\nProcessing: [Gender: ${genderCat}, SubCategory: ${subCat}]`);
      
      // Try primary query format: "{genderCategory} {subCategory} clothing model"
      let query = `${genderCat} ${subCat} clothing model`;
      console.log(`Querying: "${query}"`);
      let photos = await fetchPhotosFromPexels(query, 5);

      // Fallback 1: "{genderCategory} {subCategory} clothing"
      if (photos.length < 5) {
        const fallbackQuery1 = `${genderCat} ${subCat} clothing`;
        console.log(`Insufficient results (${photos.length}). Retrying fallback: "${fallbackQuery1}"`);
        const fallbackPhotos = await fetchPhotosFromPexels(fallbackQuery1, 5);
        
        // Merge without duplicates
        const existingUrls = new Set(photos.map(p => p.url));
        for (const p of fallbackPhotos) {
          if (!existingUrls.has(p.url) && photos.length < 5) {
            photos.push(p);
          }
        }
      }

      // Fallback 2: "{subCategory} clothing model" (generalizing gender if needed)
      if (photos.length < 5) {
        const fallbackQuery2 = `${subCat} clothing model`;
        console.log(`Insufficient results (${photos.length}). Retrying fallback: "${fallbackQuery2}"`);
        const fallbackPhotos2 = await fetchPhotosFromPexels(fallbackQuery2, 5);
        
        const existingUrls = new Set(photos.map(p => p.url));
        for (const p of fallbackPhotos2) {
          if (!existingUrls.has(p.url) && photos.length < 5) {
            photos.push(p);
          }
        }
      }

      // Fallback 3: "{subCategory} clothing" (last resort)
      if (photos.length < 5) {
        const fallbackQuery3 = `${subCat} clothing`;
        console.log(`Insufficient results (${photos.length}). Retrying fallback: "${fallbackQuery3}"`);
        const fallbackPhotos3 = await fetchPhotosFromPexels(fallbackQuery3, 5);
        
        const existingUrls = new Set(photos.map(p => p.url));
        for (const p of fallbackPhotos3) {
          if (!existingUrls.has(p.url) && photos.length < 5) {
            photos.push(p);
          }
        }
      }

      console.log(`Result: Found ${photos.length} photos.`);
      results.push({
        genderCategory: genderCat,
        subCategory: subCat,
        images: photos
      });

      // Be kind to the API rate limit (200 requests/hr is ~1 request every 18 seconds, but for a one-time script we can wait 400ms)
      await delay(400);
    }
  }

  // Save the result JSON array
  const outputPath = path.join(process.cwd(), 'pexels_images.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\n✓ Successfully fetched images and saved results to ${outputPath}`);
}

run().catch(console.error);
