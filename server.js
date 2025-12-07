const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Utiliser le plugin Stealth avec configuration optimale pour contourner Cloudflare
puppeteer.use(StealthPlugin());

// Configuration supplémentaire pour éviter la détection
const stealthConfig = {
  enabledEvasions: new Set([
    'chrome.app',
    'chrome.csi',
    'chrome.loadTimes',
    'chrome.runtime',
    'iframe.contentWindow',
    'media.codecs',
    'navigator.hardwareConcurrency',
    'navigator.languages',
    'navigator.permissions',
    'navigator.plugins',
    'navigator.vendor',
    'navigator.webdriver',
    'user-agent-override',
    'webrtc'
  ])
};

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
    
    // Option 1: Utiliser ScraperAPI si la clé API est configurée (gratuit: 5000 req/mois)
    const SCRAPERAPI_KEY = process.env.SCRAPERAPI_KEY;
    
    if (SCRAPERAPI_KEY) {
      console.log('Using ScraperAPI to bypass Cloudflare...');
      try {
        // Utiliser HTTPS et ajouter des paramètres pour le rendu JavaScript et premium pour domaines protégés
        // premium=true est nécessaire pour les sites protégés par Cloudflare comme kunmanga.com
        const scraperApiUrl = `https://api.scraperapi.com?api_key=${SCRAPERAPI_KEY}&url=${encodeURIComponent(url)}&render=true&premium=true`;
        
        console.log(`Fetching via ScraperAPI: ${url}`);
        
        const response = await fetch(scraperApiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
          },
          timeout: 60000 // Augmenter à 60 secondes
        });
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'No error details');
          console.log(`ScraperAPI HTTP ${response.status} error: ${errorText.substring(0, 200)}`);
          throw new Error(`ScraperAPI error: HTTP ${response.status} - ${errorText.substring(0, 100)}`);
        }
        
        const html = await response.text();
        const images = extractKunmangaImages(html, url);
        
        if (images.length > 0) {
          console.log(`ScraperAPI: Extracted ${images.length} images`);
          
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
          return;
        } else {
          console.log('ScraperAPI: No images found, falling back to Puppeteer...');
          // Continue vers Puppeteer
        }
      } catch (scraperError) {
        console.log(`ScraperAPI failed: ${scraperError.message}, falling back to Puppeteer...`);
        // Continue vers Puppeteer en cas d'erreur
      }
    }
    
    // Si ScraperAPI n'est pas configuré, a échoué, ou n'a pas trouvé d'images, utiliser Puppeteer
    console.log('Using Puppeteer as fallback or primary method...');
    
    // Utiliser Puppeteer pour simuler un vrai navigateur
    let browser;
    try {
      console.log('Launching Puppeteer browser...');
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
      
      console.log('Browser launched, creating new page...');
      const page = await browser.newPage();
      
      console.log('Setting up stealth features...');
      // Masquer les signaux de bot
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined
        });
        
        // Masquer Chrome automation
        window.chrome = {
          runtime: {}
        };
        
        // Permissions
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
        
        // Plugins
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5]
        });
        
        // Languages
        Object.defineProperty(navigator, 'languages', {
          get: () => ['fr-FR', 'fr', 'en-US', 'en']
        });
      });
      
      // Configurer le viewport et User-Agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
      
      // Ajouter des headers supplémentaires
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
      });
      
      // Naviguer vers la page
      console.log(`Navigating to ${url}...`);
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      console.log('Page loaded, checking for Cloudflare...');
      
      // Attendre que Cloudflare Turnstile soit résolu
      // Vérifier si on est bloqué par Cloudflare
      let isCloudflareBlocked = true;
      let attempts = 0;
      const maxAttempts = 30; // 30 tentatives de 2 secondes = 60 secondes max
      
      while (isCloudflareBlocked && attempts < maxAttempts) {
        await page.waitForTimeout(2000);
        attempts++;
        
        const check = await page.evaluate(() => {
          const bodyText = document.body ? document.body.innerText : '';
          const hasCloudflare = bodyText.includes('Verify you are human') || 
                               bodyText.includes('review the security') ||
                               bodyText.includes('Un instant') ||
                               document.querySelector('#cf-chl-widget') !== null ||
                               document.querySelector('iframe[src*="challenges.cloudflare.com"]') !== null ||
                               document.querySelector('iframe[src*="turnstile"]') !== null;
          const hasContent = document.querySelector('.reading-content') !== null ||
                            document.querySelector('.wp-manga-section') !== null ||
                            document.querySelector('main') !== null ||
                            document.querySelector('article') !== null;
          
          // Vérifier aussi les images
          const totalImages = document.querySelectorAll('img').length;
          const readingContentImages = document.querySelectorAll('.reading-content img').length;
          
          // Vérifier le titre de la page
          const pageTitle = document.title;
          const hasMangaTitle = pageTitle.toLowerCase().includes('chapter') || 
                               pageTitle.toLowerCase().includes('manga') ||
                               pageTitle.toLowerCase().includes('read');
          const isCloudflareWaiting = pageTitle.includes('Un instant') || pageTitle.includes('Just a moment');
          
          // Vérifier les iframes Turnstile
          const turnstileIframes = document.querySelectorAll('iframe[src*="turnstile"], iframe[src*="challenges"]').length;
          
          return { 
            hasCloudflare, 
            hasContent, 
            totalImages,
            readingContentImages,
            hasMangaTitle,
            isCloudflareWaiting,
            turnstileIframes,
            pageTitle: pageTitle.substring(0, 50),
            bodyText: bodyText.substring(0, 150),
            url: window.location.href
          };
        });
        
        console.log(`Attempt ${attempts}: Cloudflare=${check.hasCloudflare}, Waiting=${check.isCloudflareWaiting}, Content=${check.hasContent}, Images=${check.totalImages}, Turnstile=${check.turnstileIframes}, Title="${check.pageTitle}"`);
        
        // Si on a du contenu ou des images, considérer que c'est bon
        if (!check.hasCloudflare && !check.isCloudflareWaiting && (check.hasContent || check.totalImages > 0 || check.hasMangaTitle)) {
          isCloudflareBlocked = false;
          console.log('Content detected! Cloudflare resolved or page loaded.');
          break;
        }
        
        // Si on n'est plus en attente Cloudflare et qu'on a des images, continuer
        if (!check.isCloudflareWaiting && check.totalImages > 0) {
          isCloudflareBlocked = false;
          console.log('Images found, continuing extraction...');
          break;
        }
        
        // Si on est toujours bloqué après 10 secondes, essayer de cliquer/interagir
        if (attempts === 5) {
          try {
            // Essayer de trouver et cliquer sur le bouton Turnstile si présent
            const turnstileButton = await page.$('iframe[src*="challenges.cloudflare.com"]');
            if (turnstileButton) {
              console.log('Found Turnstile iframe, waiting for auto-resolution...');
            }
          } catch (e) {
            // Ignore
          }
        }
      }
      
      // Ne pas échouer si Cloudflare n'est plus présent, même sans contenu détecté
      // Le contenu peut être chargé différemment
      if (attempts >= maxAttempts) {
        const finalCheck = await page.evaluate(() => {
          const bodyText = document.body ? document.body.innerText : '';
          const hasCloudflare = bodyText.includes('Verify you are human') || 
                               bodyText.includes('review the security');
          return { hasCloudflare, bodyText: bodyText.substring(0, 200) };
        });
        
        if (finalCheck.hasCloudflare) {
          throw new Error('Cloudflare challenge not resolved after 60 seconds');
        } else {
          console.log('Cloudflare not detected, continuing with extraction even if content not found...');
        }
      }
      
      // Attendre que .reading-content apparaisse
      try {
        await page.waitForSelector('.reading-content', { timeout: 10000 });
        console.log('.reading-content found!');
      } catch (e) {
        console.log('.reading-content not found, checking alternatives...');
      }
      
      // Attendre le chargement JavaScript
      await page.waitForTimeout(3000);
      
      // Scroller pour déclencher le lazy loading
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(3000);
      
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(2000);
      
      // Vérification finale
      const finalCheck = await page.evaluate(() => {
        return {
          readingContent: !!document.querySelector('.reading-content'),
          readingContentImages: document.querySelectorAll('.reading-content img').length,
          totalImages: document.querySelectorAll('img').length
        };
      });
      console.log('Final check:', JSON.stringify(finalCheck, null, 2));
      
      // Extraire les images directement via JavaScript dans le navigateur
      const images = await page.evaluate((baseUrl) => {
        const imageUrls = [];
        const debug = [];
        
        // Sélecteur principal: .reading-content img (11 images trouvées manuellement)
        const readingContent = document.querySelector('.reading-content');
        debug.push(`.reading-content exists: ${!!readingContent}`);
        
        if (readingContent) {
          const imgs = readingContent.querySelectorAll('img');
          debug.push(`Found ${imgs.length} images in .reading-content`);
          
          imgs.forEach((img, index) => {
            // PRIORITÉ: img.src (les images KunManga ont src directement)
            let src = img.src;
            
            if (!src || !src.trim()) {
              src = img.getAttribute('data-src') || 
                    img.getAttribute('data-lazy-src') || 
                    img.getAttribute('data-original') ||
                    img.getAttribute('data-url');
            }
            
            const width = img.naturalWidth || img.width || 0;
            const height = img.naturalHeight || img.height || 0;
            
            debug.push(`Image ${index}: src=${src ? src.substring(0, 50) : 'none'}, size=${width}x${height}`);
            
            if (src && typeof src === 'string' && src.trim()) {
              src = src.trim();
              const lowerSrc = src.toLowerCase();
              
              // Filtrer les placeholders
              const isPlaceholder = lowerSrc.includes('placeholder') || 
                                   lowerSrc.includes('spinner') || 
                                   lowerSrc.includes('loading') ||
                                   lowerSrc.includes('1x1') ||
                                   lowerSrc.startsWith('data:image/svg');
              
              // Vérifier la taille (images manga: width ~800, height > 10000)
              const isLargeImage = width >= 500 || height >= 5000;
              
              debug.push(`  -> placeholder:${isPlaceholder}, large:${isLargeImage}, width:${width}`);
              
              if (!isPlaceholder && (isLargeImage || width === 0)) {
                try {
                  const absoluteUrl = new URL(src, baseUrl).href;
                  if (absoluteUrl && absoluteUrl.startsWith('http')) {
                    imageUrls.push(absoluteUrl);
                    debug.push(`  -> ADDED: ${absoluteUrl.substring(0, 60)}`);
                  }
                } catch (e) {
                  debug.push(`  -> ERROR: ${e.message}`);
                }
              } else {
                debug.push(`  -> FILTERED`);
              }
            } else {
              debug.push(`  -> NO SRC`);
            }
          });
        } else {
          debug.push('No .reading-content found, trying fallback');
          // Fallback: toutes les images
          const allImgs = document.querySelectorAll('img');
          debug.push(`Fallback: Found ${allImgs.length} total images`);
          allImgs.forEach((img, index) => {
            const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
            if (src && src.startsWith('http') && !src.toLowerCase().includes('placeholder')) {
              try {
                const absoluteUrl = new URL(src, baseUrl).href;
                if (absoluteUrl && absoluteUrl.startsWith('http')) {
                  imageUrls.push(absoluteUrl);
                }
              } catch (e) {}
            }
          });
        }
        
        // Retourner les images et les logs de debug
        return { images: imageUrls, debug: debug };
      }, url);
      
      // Logger les résultats de debug
      if (images.debug && images.debug.length > 0) {
        console.log('Image extraction debug:');
        images.debug.forEach(line => console.log('  ' + line));
      }
      
      const imageUrls = images.images || images; // Support ancien format
      
      await browser.close();
      browser = null;
      
      // Log pour debug
      console.log(`Extracted ${imageUrls ? imageUrls.length : 0} images from ${url}`);
      if (imageUrls && imageUrls.length > 0) {
        console.log('First image URL:', imageUrls[0].substring(0, 80));
      }
      
      if (!imageUrls || imageUrls.length === 0) {
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
    
    const imagesHtml = imageUrls.map(imgUrl => 
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
    <p><strong>Nombre d'images :</strong> ${imageUrls.length}</p>
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


