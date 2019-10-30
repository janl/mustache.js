const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const chai = require('chai');

const mustache = fs.readFileSync(path.join(__dirname, '../../mustache.js'), 'utf8');

describe('Browser usage', () => {

  let browser;
  let page;

  before(async function () {
    this.timeout(10 * 1000);

    // Awkward .launch() options below are needed to avoid hitting timeouts
    // when tests are run in GitHub Actions for some weird reason
    // https://github.com/GoogleChrome/puppeteer/issues/4617
    browser = await puppeteer.launch({ignoreDefaultArgs: ['--disable-extensions']});

    page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err));
  });

  after(() => browser.close());

  it('is exposed on the global scope as window.Mustache', async () => {
    await page.goto(`file://${path.join(__dirname, '_fixtures/global-scope.html')}`);

    const bodyElement = await page.$('body');
    const textContentProperty = await bodyElement.getProperty('textContent');
    const value = await textContentProperty.jsonValue();

    chai.assert.equal(value.trim(), 'Joe spends 6');
  });

  it('is exposed as AMD and consumable via RequireJS', async function () {
    this.timeout(10 * 1000);

    await page.goto(`file://${path.join(__dirname, '_fixtures/amd.html')}`, { waitUntil: 'networkidle0' });

    const bodyElement = await page.$('body');
    const textContentProperty = await bodyElement.getProperty('textContent');
    const value = await textContentProperty.jsonValue();

    chai.assert.equal(value, 'Joe spends 6');
  });
});
