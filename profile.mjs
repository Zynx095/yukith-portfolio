import puppeteer from 'puppeteer';

(async () => {
  console.log('Starting profiler...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1920, height: 1080 });
  
  async function measureFPS(durationMs, flag = '') {
    const url = flag ? `http://localhost:3000/?${flag}=true` : 'http://localhost:3000/';
    console.log(`\nNavigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    const stats = await page.evaluate(async (duration) => {
      return new Promise((resolve) => {
        let frames = 0;
        let start = performance.now();
        let end = start + duration;
        
        // Accumulate calls correctly by querying inside the loop
        let totalCalls = 0;
        let samples = 0;
        let triangles = 0;
        
        function loop() {
          frames++;
          if (window.DEBUG_RENDERER) {
            totalCalls += window.DEBUG_RENDERER.info.render.calls;
            triangles += window.DEBUG_RENDERER.info.render.triangles;
            samples++;
          }
          if (performance.now() < end) {
            requestAnimationFrame(loop);
          } else {
            const actualDuration = performance.now() - start;
            const fps = (frames / actualDuration) * 1000;
            
            let result = { fps: Math.round(fps * 100) / 100 };
            if (samples > 0) {
              result.avgCalls = Math.round(totalCalls / samples);
              result.avgTriangles = Math.round(triangles / samples);
            }
            resolve(result);
          }
        }
        requestAnimationFrame(loop);
      });
    }, durationMs);
    
    return stats;
  }
  
  const stats = await measureFPS(3000, '');
  console.log(`[BASELINE] => FPS: ${stats.fps}, Avg Calls: ${stats.avgCalls || 'N/A'}, Triangles: ${stats.avgTriangles || 'N/A'}`);
  
  // also scrolling
  console.log('Testing scroll...');
  const scrollInterval = setInterval(async () => {
    await page.mouse.wheel({ deltaY: 100 });
  }, 50);
  
  const scrollStats = await measureFPS(3000, '');
  clearInterval(scrollInterval);
  
  console.log(`[SCROLLING] => FPS: ${scrollStats.fps}, Avg Calls: ${scrollStats.avgCalls || 'N/A'}`);
  
  await browser.close();
})();
