const puppeteer = require('puppeteer');
const chromeLauncher = require('chrome-launcher');
const axios = require('axios');
const Xvfb = require('xvfb');
require('dotenv').config();

async function run() {
  const xvfb = new Xvfb()
  xvfb.start(function (err, xvfbProcess) {
    const chromeConfig = {
      chromeFlags: ['--start-maximized'],
      permissions: ['clipboardWrite'],
    }

    async function launch() {
      const chrome = await chromeLauncher.launch(chromeConfig);

      console.log('POSRT:', chrome.port); // to see chrome launcher instance properties
      const response = await axios.get(
        `http://localhost:${chrome.port}/json/version`,
      )
      const { webSocketDebuggerUrl } = response.data;

      const browser = await puppeteer.connect({
        browserWSEndpoint: webSocketDebuggerUrl,
        defaultViewport: null,
        args: ['--start-maximized'],
      })

      const context = browser.defaultBrowserContext();
      await context.overridePermissions('https://us02web.zoom.us/', [
        'clipboard-read',
        'clipboard-write',
      ]);

      const page = await browser.newPage();
      const userAgent =
        'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Mobile Safari/537.36'
      await page.setUserAgent(userAgent);
      await page.goto('https://people.zoho.in/', { waitUntil: ['load'] });

      
        await page.click('div.header a.zgh-login');
        // await page.waitForNavigation();
        await page.waitForTimeout(5000);
        await page.click('span.google_icon');
        await page.waitForNavigation();
        await gmailLogin(page); //gmail sign in

      await page.waitForTimeout(5000);

      const checkout = (await page.$('div.out.CP')) || null;
      console.log(checkout);
      await page.waitForTimeout(5000);
    //   const checkin = (await page.$('div.in.CP')) || null;
      const time = await page.evaluate(() => document.querySelector('span#ZPD_Top_Att_THrs').innerText);
      console.log(time);
      const duration = +time.split(" ")[0].substring(0, 2);
      const now = new Date();
      console.log(now.getDay());
      if(checkout){
        if(duration >= 8){
            //today
            if(duration <= 12)
                await page.click('div.out.CP');
            else{
                //next day
                await page.click('div.out.CP');
                await page.waitForTimeout(5000);
                if(now.getDay() >= 1 && now.getDay() < 6)
                    await page.click('div.in.CP');
            }
        }
      }else{
        if(now.getDay() >= 1 && now.getDay() < 6)
            await page.click('div.in.CP');
      }

      await page.waitForTimeout(10000);
      await page.screenshot({ path: 'loginresult.png' });
      await browser.close();
    }

    async function gmailLogin(page) {
      
      // await page.goto('http://accounts.google.com');

      await page.focus('input[type="email"]');
      await page.keyboard.type(process.env.GMAIL_EMAIL, { delay: 50 });

      await page.click('#identifierNext');

      await page.waitForNavigation();

      await page.waitForTimeout(5000);

      await page.focus('input[type="password"]');
      await page.keyboard.type(process.env.GMAIL_PASSWORD);

      await page.click('div.VfPpkd-dgl2Hf-ppHlrf-sM5MNb>button');
      await page.waitForNavigation();
    }

    launch()
      .then(function(){
        console.log('ok');
      })
      .catch(function(err){
        console.error(err);
      })
    xvfb.stop(function (err) {
      // Xvfb stopped
    })
  })
}


//COMMENT BELOW IIFE TO RUN AS CRONJOB
(async function letsGo(){
  console.log("LET'S GOOOOO......");
  await run();
})();


module.exports.run = run;
