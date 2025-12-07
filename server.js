const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function extractKunmangaImages(html, baseUrl) {
  const $ = cheerio.load(html);
  const imageUrls = new Set();
  
  // Sélecteurs prioritaires pour KunManga
  const selectors = [
    '#readerarea img',
    '#readerarea picture img',
    '.reading-content img',
    '.reading-content picture img',
    '.page-break img',
    '.entry-content img',
    '.wp-manga-chapter-img',
    '.chapter-content img',
    '.chapter-reader img',
    '[class*="reader"] img',
    '[class*="chapter"] img',
    '[id*="reader"] img',
    '[id*="chapter"] img'
  ];
  
  let found = false;
  for (const selector of selectors) {
    const images = $(selector);
    if (images.length > 0) {
      found = true;
      images.each((i, elem) => {
        const $img = $(elem);
        // Essayer plusieurs attributs pour les images lazy-load
        let src = $img.attr('data-src') || 
                  $img.attr('data-lazy-src') || 
                  $img.attr('data-original') ||
                  $img.attr('data-url') ||
                  $img.attr('src');
        
        if (src) {
          // Filtrer les images de placeholder/spinner
          const lowerSrc = src.toLowerCase();
          if (lowerSrc.includes('placeholder') || 
              lowerSrc.includes('spinner') || 
              lowerSrc.includes('loading') ||
              lowerSrc.includes('1x1') ||
              lowerSrc.includes('data:image/svg')) {
            return; // Skip placeholder images
          }
          
          try {
            const absoluteUrl = new URL(src, baseUrl).href;
            // Filtrer les URLs invalides
            if (absoluteUrl && absoluteUrl.startsWith('http')) {
              imageUrls.add(absoluteUrl);
            }
          } catch (e) {
            // Invalid URL, skip
          }
        }
      });
      if (imageUrls.size > 0) {
        break;
      }
    }
  }
  
  // Fallback: toutes les images si rien trouvé
  if (!found || imageUrls.size === 0) {
    const allImages = $('img');
    allImages.each((i, elem) => {
      const $img = $(elem);
      let src = $img.attr('data-src') || 
                $img.attr('data-lazy-src') || 
                $img.attr('data-original') ||
                $img.attr('data-url') ||
                $img.attr('src');
      
      if (src) {
        const lowerSrc = src.toLowerCase();
        // Filtrer les placeholders
        if (lowerSrc.includes('placeholder') || 
            lowerSrc.includes('spinner') || 
            lowerSrc.includes('loading') ||
            lowerSrc.includes('1x1') ||
            lowerSrc.includes('data:image/svg')) {
          return;
        }
        
        try {
          const absoluteUrl = new URL(src, baseUrl).href;
          if (absoluteUrl && absoluteUrl.startsWith('http')) {
            imageUrls.add(absoluteUrl);
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    });
  }
  
  return Array.from(imageUrls);
}

app.get('/', async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  
  const url = req.query.url;
  
  if (!url) {
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manga Cleaner</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background-color: #1a1a1a;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      width: 100%;
      background-color: #2a2a2a;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
    h1 {
      margin-bottom: 30px;
      text-align: center;
      color: #fff;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }
    label {
      font-weight: 500;
      color: #ccc;
    }
    input[type="text"] {
      padding: 12px;
      background-color: #1a1a1a;
      border: 1px solid #444;
      border-radius: 4px;
      color: #e0e0e0;
      font-size: 16px;
      width: 100%;
    }
    input[type="text"]:focus {
      outline: none;
      border-color: #666;
    }
    button {
      padding: 12px 24px;
      background-color: #4a9eff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    button:hover {
      background-color: #3a8eef;
    }
    button:active {
      background-color: #2a7edf;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Manga Cleaner</h1>
    <form method="GET" action="/">
      <label for="url">URL du chapitre manga :</label>
      <input type="text" id="url" name="url" placeholder="https://kunmanga.com/..." required>
      <button type="submit">Nettoyer</button>
    </form>
  </div>
</body>
</html>
    `);
    return;
  }
  
  try {
    const urlObj = new URL(url);
    
    // Utiliser Puppeteer pour simuler un vrai navigateur
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
      
      const page = await browser.newPage();
      
      // Configurer le viewport et User-Agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
      
      // Naviguer vers la page
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      // Attendre que la page soit complètement chargée
      await page.waitForTimeout(2000);
      
      // Scroller la page pour déclencher le lazy loading des images
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000);
      
      // Scroller vers le haut
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
      
      // Extraire les images directement via JavaScript dans le navigateur
      const images = await page.evaluate((baseUrl) => {
        const imageUrls = new Set();
        
        // Sélecteurs prioritaires pour KunManga (basés sur la structure réelle)
        const selectors = [
          '.reading-content img',  // PRIORITÉ: 11 images trouvées
          '.reading-content picture img',
          '.wp-manga-section img',
          '.wp-manga-section .reading-content img',
          '#readerarea img',
          '#readerarea picture img',
          '.page-break img',
          '.entry-content img',
          '.wp-manga-chapter-img',
          '.wp-manga-chapter-img img',
          '.chapter-content img',
          '.chapter-reader img',
          '[class*="reader"] img',
          '[class*="chapter"] img',
          '[id*="reader"] img',
          '[id*="chapter"] img'
        ];
        
        // Essayer chaque sélecteur
        for (const selector of selectors) {
          const images = document.querySelectorAll(selector);
          if (images.length > 0) {
            images.forEach(img => {
              // Essayer plusieurs attributs pour les images lazy-load
              let src = img.getAttribute('data-src') || 
                       img.getAttribute('data-lazy-src') || 
                       img.getAttribute('data-original') ||
                       img.getAttribute('data-url') ||
                       img.getAttribute('data-lazy') ||
                       img.dataset.src || 
                       img.dataset.lazySrc || 
                       img.dataset.original ||
                       img.dataset.url ||
                       img.src ||
                       (img.tagName === 'SOURCE' ? img.srcset : null);
              
              if (src) {
                const lowerSrc = src.toLowerCase();
                // Filtrer les placeholders et les petites images (probablement des icônes)
                const isPlaceholder = lowerSrc.includes('placeholder') || 
                                     lowerSrc.includes('spinner') || 
                                     lowerSrc.includes('loading') ||
                                     lowerSrc.includes('1x1') ||
                                     lowerSrc.startsWith('data:image/svg') ||
                                     lowerSrc.includes('icon') ||
                                     lowerSrc.includes('logo');
                
                // Vérifier la taille réelle de l'image si disponible
                const isSmallImage = img.naturalWidth && img.naturalWidth < 100;
                
                if (!isPlaceholder && !isSmallImage) {
                  try {
                    const absoluteUrl = new URL(src, baseUrl).href;
                    if (absoluteUrl && absoluteUrl.startsWith('http')) {
                      imageUrls.add(absoluteUrl);
                    }
                  } catch (e) {
                    // Invalid URL, skip
                  }
                }
              }
            });
            if (imageUrls.size > 0) break;
          }
        }
        
        // Fallback: toutes les images
        if (imageUrls.size === 0) {
          document.querySelectorAll('img').forEach(img => {
            let src = img.dataset.src || 
                     img.dataset.lazySrc || 
                     img.dataset.original ||
                     img.dataset.url ||
                     img.src;
            
            if (src) {
              const lowerSrc = src.toLowerCase();
              if (!lowerSrc.includes('placeholder') && 
                  !lowerSrc.includes('spinner') && 
                  !lowerSrc.includes('loading') &&
                  !lowerSrc.includes('1x1') &&
                  !lowerSrc.startsWith('data:image/svg')) {
                try {
                  const absoluteUrl = new URL(src, baseUrl).href;
                  if (absoluteUrl && absoluteUrl.startsWith('http')) {
                    imageUrls.add(absoluteUrl);
                  }
                } catch (e) {
                  // Invalid URL, skip
                }
              }
            }
          });
        }
        
        return Array.from(imageUrls);
      }, url);
      
      await browser.close();
      browser = null;
      
      if (images.length === 0) {
      res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erreur - Manga Cleaner</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background-color: #1a1a1a;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      width: 100%;
      background-color: #2a2a2a;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
    h1 {
      margin-bottom: 20px;
      color: #ff6b6b;
    }
    .error-info {
      background-color: #1a1a1a;
      padding: 20px;
      border-radius: 4px;
      margin: 20px 0;
    }
    code {
      background-color: #0a0a0a;
      padding: 2px 6px;
      border-radius: 3px;
      color: #4a9eff;
      word-break: break-all;
    }
    .selectors {
      margin-top: 15px;
      font-size: 14px;
      color: #aaa;
    }
    a {
      color: #4a9eff;
      text-decoration: none;
      margin-top: 20px;
      display: inline-block;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Aucune image trouvée</h1>
    <div class="error-info">
      <p><strong>URL source :</strong></p>
      <code>${escapeHtml(url)}</code>
      <div class="selectors">
        <p><strong>Sélecteurs utilisés :</strong></p>
        <ul>
          <li><code>#readerarea img</code></li>
          <li><code>.reading-content img</code></li>
          <li><code>.page-break img</code></li>
          <li><code>.entry-content img</code></li>
          <li><code>img</code> (fallback)</li>
        </ul>
      </div>
      <p style="margin-top: 15px;">Aucune image n'a pu être extraite de cette page. Vérifiez que l'URL est correcte et qu'il s'agit bien d'une page de chapitre manga.</p>
    </div>
    <a href="/">← Retour au formulaire</a>
  </div>
</body>
</html>
      `);
      return;
    }
    
    const imagesHtml = images.map(imgUrl => 
      `<img src="${escapeHtml(imgUrl)}" alt="Page manga" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">`
    ).join('\n');
    
    res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Manga Cleaner - Résultat</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background-color: #000000;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    .info-bar {
      position: sticky;
      top: 0;
      background-color: #1a1a1a;
      padding: 15px 20px;
      border-bottom: 1px solid #333;
      z-index: 100;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    .info-bar p {
      margin: 5px 0;
      font-size: 14px;
    }
    code {
      background-color: #0a0a0a;
      padding: 2px 6px;
      border-radius: 3px;
      color: #4a9eff;
      word-break: break-all;
      font-size: 12px;
    }
    .images-container {
      padding: 20px 0;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="info-bar">
    <p><strong>Pages extraites depuis :</strong> <code>${escapeHtml(url)}</code></p>
    <p><strong>Nombre d'images :</strong> ${images.length}</p>
  </div>
  <div class="images-container">
    ${imagesHtml}
  </div>
</body>
</html>
    `);
      
    } catch (puppeteerError) {
      // Fermer le browser en cas d'erreur Puppeteer
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          // Ignore
        }
      }
      throw puppeteerError;
    }
    
  } catch (error) {
    
    res.status(500).send(`
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erreur - Manga Cleaner</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background-color: #1a1a1a;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      width: 100%;
      background-color: #2a2a2a;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
    h1 {
      margin-bottom: 20px;
      color: #ff6b6b;
    }
    .error-info {
      background-color: #1a1a1a;
      padding: 20px;
      border-radius: 4px;
      margin: 20px 0;
    }
    code {
      background-color: #0a0a0a;
      padding: 2px 6px;
      border-radius: 3px;
      color: #4a9eff;
      word-break: break-all;
    }
    a {
      color: #4a9eff;
      text-decoration: none;
      margin-top: 20px;
      display: inline-block;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>❌ Erreur</h1>
    <div class="error-info">
      <p><strong>Erreur :</strong></p>
      <code>${escapeHtml(error.message)}</code>
      <p style="margin-top: 15px;">Une erreur s'est produite lors de la récupération ou du traitement de la page.</p>
    </div>
    <a href="/">← Retour au formulaire</a>
  </div>
</body>
</html>
    `);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Manga Cleaner server running on port ${PORT}`);
});


