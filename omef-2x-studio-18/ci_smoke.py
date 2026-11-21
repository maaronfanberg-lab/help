"""Reproducible GitHub Actions browser test for OMEF Studio 18."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    src=(Path(__file__).parent/'index.html').read_text()
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        for w,h in ((390,844),(667,375)):
            page=await browser.new_page(viewport={'width':w,'height':h},is_mobile=True,has_touch=True,device_scale_factor=1)
            errors=[]
            page.on('pageerror',lambda e: errors.append(str(e)))
            await page.set_content(src,wait_until='load',timeout=60000)
            await page.wait_for_function('window.__omefBootReady===true',timeout=60000)
            s=await page.evaluate('window.__omefTest.getStatus()')
            assert s['workerReady'] and s['stepCount']==32,s
            assert (await page.locator('#focusSlider').bounding_box())['width']>180
            await page.locator('#focusSlider').evaluate("""el=>{
                el.value=el.max;
                el.dispatchEvent(new Event('input',{bubbles:true}));
                el.dispatchEvent(new Event('change',{bubbles:true}));
            }""")
            await page.wait_for_function('window.__omefTest.getStatus().delta>0.001',timeout=15000)
            impact=await page.evaluate('window.__omefTest.impact()')
            assert impact and impact['rms']>0 and impact['nonzero']>0
            await page.locator('#play').click()
            step=await page.evaluate('window.__omefTest.getStatus().stepCount')
            await page.wait_for_function(f'window.__omefTest.getStatus().stepCount>{step+5}',timeout=20000)
            await page.locator('#play').click()
            await page.locator('#allControls').click()
            assert await page.locator('#sliders').evaluate("e=>getComputedStyle(e).display")=='grid'
            await page.locator('#allControls').click()
            await page.locator('#expand').click()
            assert abs((await page.locator('#stage').bounding_box())['height']-h)<2
            await page.locator('#expand').click()
            assert not errors,errors
            print(f'PASS {w} x {h}: worker, slider, delta, Play, drawer, fullscreen')
            await page.close()
        await browser.close()

asyncio.run(main())
