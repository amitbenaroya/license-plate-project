const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173/#/map', { waitUntil: 'networkidle' });
  console.log("Page loaded. Checking map wrapper height...");
  
  const mapHeight = await page.evaluate(() => {
    const el = document.querySelector('.map-wrapper');
    return el ? el.clientHeight : null;
  });
  console.log("Map wrapper height:", mapHeight);
  
  const containerHeight = await page.evaluate(() => {
    const el = document.querySelector('.leaflet-container');
    return el ? el.clientHeight : null;
  });
  console.log("Leaflet container height:", containerHeight);

  // Check if map empty state is shown
  const emptyState = await page.evaluate(() => !!document.querySelector('.map-empty-state'));
  console.log("Empty state shown:", emptyState);

  // Mock adding a history record
  console.log("Adding mock history record with location...");
  await page.evaluate(() => {
    localStorage.setItem('il-vehicle-search-history', JSON.stringify([{
      id: 'test-123',
      licensePlate: '1234567',
      searchedAt: new Date().toISOString(),
      vehicleInfo: { manufacturer: 'Test', model: 'Car', year: 2020 },
      found: true,
      location: { lat: 32.0853, lng: 34.7818, accuracy: 10 }
    }]));
  });

  console.log("Reloading page...");
  await page.reload({ waitUntil: 'networkidle' });
  
  const newMapHeight = await page.evaluate(() => {
    const el = document.querySelector('.map-wrapper');
    return el ? el.clientHeight : null;
  });
  console.log("Map wrapper height after data:", newMapHeight);
  
  const newContainerHeight = await page.evaluate(() => {
    const el = document.querySelector('.leaflet-container');
    return el ? el.clientHeight : null;
  });
  console.log("Leaflet container height after data:", newContainerHeight);

  await browser.close();
})();
