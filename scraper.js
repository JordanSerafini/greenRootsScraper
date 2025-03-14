const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const CATEGORIES_URLS = [
    'https://www.willemsefrance.fr/collections/arbres-a-fleurs',
    'https://www.willemsefrance.fr/collections/arbres-persistants',
    'https://www.willemsefrance.fr/collections/grands-arbres',
    'https://www.willemsefrance.fr/collections/petits-arbres',
    'https://www.willemsefrance.fr/collections/acacias-acacia-lat',
    'https://www.willemsefrance.fr/collections/arbre-de-judee',
    'https://www.willemsefrance.fr/collections/bouleau-betula-lat',
    'https://www.willemsefrance.fr/collections/cerisier-du-japon',
    'https://www.willemsefrance.fr/collections/coniferes',
    'https://www.willemsefrance.fr/collections/acacias-acacia-lat',
    'https://www.willemsefrance.fr/collections/albizia',,
    'https://www.willemsefrance.fr/collections/chene-quercus-lat',
    'https://www.willemsefrance.fr/collections/erable',
    'https://www.willemsefrance.fr/collections/frene-fraxinus-lat',
    'https://www.willemsefrance.fr/collections/hetre-fagus-lat'
];

async function appendToFile(data) {
    const filePath = 'arbres-willemse.jsonl';
    await fs.appendFile(filePath, JSON.stringify(data) + '\n', 'utf-8');
}

async function scrapeCategoryPage(browser, categoryUrl) {
    const page = await browser.newPage();
    let currentPage = 1;
    let hasNextPage = true;
    
    const category = categoryUrl.split('/collections/')[1];
    console.log(`\nTraitement de la catégorie: ${category}`);

    try {
        while (hasNextPage) {
            console.log(`  Page ${currentPage}...`);
            await page.goto(`${categoryUrl}?page=${currentPage}`);
            
            await page.waitForSelector('.product-item', { timeout: 10000 })
                .catch(() => {
                    console.log('Aucun produit trouvé sur cette page');
                    hasNextPage = false;
                    return;
                });

            if (!hasNextPage) break;

            const productLinks = await page.$$eval('.product-item a.product-item__aspect-ratio', 
                links => links.map(link => link.href)
            );

            for (const link of productLinks) {
                try {
                    await page.goto(link);
                    await page.waitForSelector('.product-meta__title', { timeout: 5000 });

                    try {
                        await page.waitForSelector('#read_plus', { timeout: 2000 });
                        await page.click('#read_plus');
                        await page.waitForTimeout(1000);
                    } catch (e) {
                    }

                    const productData = await page.evaluate((category) => {
                        const name = document.querySelector('.product-meta__title')?.textContent.trim();
                        const price = document.querySelector('.price')?.textContent.trim();
                        const stock = Math.floor(Math.random() * 10) + 1;

                        const characteristics = {};
                        const groups = document.querySelectorAll('.product-details__group');
                        
                        groups.forEach(group => {
                            const groupHeading = group.querySelector('.product-details__group-heading')?.textContent.trim();
                            if (groupHeading) {
                                characteristics[groupHeading] = {};
                                
                                const lines = group.querySelectorAll('.product-details__group-line');
                                lines.forEach(line => {
                                    const label = line.querySelector('.product-details__group-label')?.textContent.trim();
                                    const value = line.querySelector('.product-details__group-value')?.textContent.trim();
                                    if (label && value) {
                                        const cleanLabel = label.replace(/-$/, '').trim();
                                        characteristics[groupHeading][cleanLabel] = value;
                                    }
                                });
                            }
                        });

                        const shortDescription = document.querySelector('h2.vv-super-characteristics.h6')?.textContent.trim();
                        if (shortDescription) {
                            characteristics['Description courte'] = shortDescription;
                        }

                        const detailedContent = document.querySelector('.product-tabs__tab-item-content.rte')?.textContent.trim();
                        if (detailedContent) {
                            characteristics['Description détaillée'] = detailedContent;
                        }

                        const images = Array.from(document.querySelectorAll('.product-gallery__thumbnail-list img'))
                            .map(img => ({
                                url: img.src,
                                alt: img.alt
                            }));

                        return {
                            category,
                            name,
                            price,
                            stock,
                            characteristics,
                            images,
                            url: window.location.href,
                        };
                    }, category);

                    await appendToFile(productData);
                    console.log(`    ✓ Extrait: ${productData.name}`);

                } catch (productError) {
                    console.error(`    ✗ Erreur produit:`, productError.message);
                }
            }

            hasNextPage = await page.evaluate(() => {
                const nextButton = document.querySelector('.pagination__next');
                return nextButton && !nextButton.classList.contains('disabled');
            });

            currentPage++;
        }

    } catch (error) {
        console.error(`Erreur catégorie ${category}:`, error.message);
    } finally {
        await page.close();
    }
}

async function scrapeWillemseArbres() {
    const browser = await puppeteer.launch({ headless: false });
    
    await fs.writeFile('arbres-willemse.jsonl', '', 'utf-8');
    console.log('Fichier de données créé: arbres-willemse.jsonl');

    try {
        for (const categoryUrl of CATEGORIES_URLS) {
            await scrapeCategoryPage(browser, categoryUrl);
        }

        console.log('\nExtraction terminée! Les données ont été sauvegardées dans arbres-willemse.jsonl');

    } catch (error) {
        console.error('Erreur lors du scraping:', error);
    } finally {
        await browser.close();
    }
}

scrapeWillemseArbres(); 