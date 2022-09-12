const puppeteer = require('puppeteer');

async function click_gnb_menu(page, menu_id) {
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
}

async function open_all_lnb_menu(page, menu_id) {
    // lnb search
    const lnb_root = await page.$('#jsMdiMenu');
    const lnb_tree = await lnb_root.$('div.lnb_tree');
    const mdi_menu = await lnb_tree.$('ul.lnb_tree_wrap > li[data-depth-menu-id=' + menu_id + ']');

    // 전체열기 버튼을 찾아서 클릭
    const open_btn = await mdi_menu.$('li.freak > button');
    await open_btn.click();

    await page.waitForTimeout(3000);
}

async function navigate_lnb_menu(page, menu_id) {
    page.on('request', (req) => {
        if (req.url() == 'http://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd') {
            console.log(req.postData());
        }
    });

    // MENU 찾기
    const menu_list = await mdi_menu.$$('div.lnb_tree_box > ul.lnb_tree_root > li')

    for (let root_menu of menu_list) {
        const menu_title = await root_menu.$eval('a', el => el.innerText);
        console.log('-----' + menu_title + '-----');

        const child_menu_list = await root_menu.$$('li.CI-MDI-MENU-NO-CHILD');

        let counter = 0;

        for (let child_menu of child_menu_list) {
            const child_title = await child_menu.$eval('a', el => el.innerText);
            console.log(child_title);

            if (counter == 0) {
                anchor = await child_menu.$('a.CI-MDI-MENU');
                await anchor.click();

                // 탭 전체 닫기
                const close_tab = await page.$('#jsCloseAllViewsButton');
                await close_tab.click();
            }
            counter += 1;
        }
    }
}

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        slowMo: 250
    });

    console.log(await browser.version());

    let user_agent = await browser.userAgent();
    console.log(user_agent);
    user_agent = user_agent.replace('HeadlessChrome', 'Chrome');

    //const url = 'https://example.com';
    const url = 'http://data.krx.co.kr/contents/MDC/MAIN/main/index.cmd';
    // MDC0201 : 기초 통계
    const menu_id = 'MDC0201';

    const page = await browser.newPage();
    await page.setUserAgent(user_agent);
    await page.setViewport({
        width: 1280,
        height: 720
    });

    await page.goto(url, {
        waitUntil: 'networkidle0'
    });
    console.log(await page.evaluate(() => navigator.userAgent));

    await browser.close();
})();
