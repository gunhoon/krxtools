const fs = require('fs/promises');
const puppeteer = require('puppeteer');


async function red_file(filename) {
    try {
        return await fs.readFile(filename, { encoding: 'utf8' });
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}


async function write_file(filename, data) {
    try {
        await fs.writeFile(filename, data);
    }
    catch (e) {
        console.error(e);
        throw e;
    }
}


async function click_gnb_menu(page, menu_id) {
    // GNB(Global Navigation Bar)에서 MDI 메뉴들을 찾음.
    // MDI 메뉴는 링크가 '/contents/MDC/MDI/mdiLoader/index.cmd' 형태인 것을 의미함.
    const gnb_area = await page.$('#jsGnbArea');

    const mdi_menu_arr = await gnb_area.$$('a[href^="/contents/MDC/MDI/mdiLoader/index.cmd?menuId="]');
    const mdi_info_arr = [];

    for (let mdi_menu of mdi_menu_arr) {
        const mdi_info = await mdi_menu.evaluate(el => {
            return [
                el.getAttribute('data-depth-menu-id'),
                el.getAttribute('href'),
                el.textContent
            ];
        });
        mdi_info_arr.push(mdi_info);
    }
    const mdi_info_str = JSON.stringify(mdi_info_arr, null, 4);
    console.log(mdi_info_str);

    // 홈페이지 개편 등으로 정보가 변경되면 Update하고 Noti 함.
    // exception을 발생 시켜서 CI가 중간되고 Noti 되도록 함.
    const filename = 'data/mdi_menu.json';
    const old_info_str = await red_file(filename);

    if (mdi_info_str !== old_info_str) {
        await write_file(filename, mdi_info_str);
        console.log('mdi menu was updated');
        throw 'Error: mdi menu was updated';
    }

    // menu_id에 해당하는 메뉴를 찾아서 클릭
    for (let i = 0; i < mdi_info_arr.length; i++) {
        if (mdi_info_arr[i][0] === menu_id) {
            await mdi_menu_arr[i].evaluate(el => {
                el.click();
            });
            break;
        }
    }
    await page.waitForNetworkIdle();
    await page.waitForTimeout(3000);
}


async function expand_lnb_menu(page, menu_id) {
    // LNB 메뉴
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

    await click_gnb_menu(page, menu_id);
    await expand_lnb_menu(page, menu_id);

    await browser.close();
})();
