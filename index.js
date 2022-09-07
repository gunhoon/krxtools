const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        args: [
            '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'
        ],
        headless: true,
        slowMo: 250
    });

    console.log(await browser.version());
    console.log(await browser.userAgent());

    const page = await browser.newPage();
    await page.goto('http://data.krx.co.kr/contents/MDC/MAIN/main/index.cmd');

    // GNB(Global Navigation Bar)에서 MDI 메뉴를 찾음.
    const gnb_area = await page.$('#jsGnbArea');
    const sub_menu = await gnb_area.$('div > ul');

    const mdi_menu_list = await sub_menu.$$('a[href^="/contents/MDC/MDI/mdiLoader/index.cmd?menuId="]');
    const mdi_info_list = [];

    for (let mdi_menu of mdi_menu_list) {
        const mid_info = await mdi_menu.evaluate( (el) => {
            return [el.getAttribute('data-depth-menu-id'), el.textContent]
        });
        mdi_info_list.push(mid_info);
    }
    console.log(mdi_info_list)

    // 첫 번째 MDI_MENU 클릭
    await mdi_menu_list[0].evaluate( (el) => {
        el.click();
    });
    await page.waitForTimeout(3000);

    await browser.close();
})();
