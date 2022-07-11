const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

//IIFE - Immediately Invoked function expression

const getRank = (async (event) => {
    const nftId = event.payload.item.nft_id.split('/')[2]
    const slug = event.payload.collection.slug
    const browser = await puppeteer.launch({
        headless:true
        ,
        args: [
            '--no-sandbox',
            '--disable-dev-shm-usage', // <-- add this one
            '--disable-setuid-sandbox',
            ],
    })
    const page = await browser.newPage()

    await page.goto(`https://rarity.tools/${slug}/view/${nftId}`,{"waitUntil" : "networkidle0"})
    //await page.goto(`https://rarity.tools/pudgypenguinss/view/2447`,{"waitUntil" : "networkidle0"})
    //await page.goto(`https://luckytrader.com/nft/${slug}/rarity?sortType=1&serialNumber=${nftId}`,{"waitUntil" : "networkidle0"})


    const pageData = await page.evaluate(()=>{
        return {
            html:document.documentElement.innerHTML
        }
    })
    let $ = cheerio.load(pageData.html)
    let element = $('#__layout > div > div.absolute.top-0.z-10.w-screen.h-full.lg\\:h-screen > div.absolute.z-30.justify-center.w-full.h-full.lg\\:flex.top-12.l-0.lg\\:top-0.lg\\:items-center > div > div.mx-auto.text-center.lg\\:overflow-auto.scrollColor > div > div.flex.flex-row.mx-4.mb-0\\.5.mt-2.text-lg.textColor600.overflow-hidden.items-baseline > div:nth-child(1) > span')
    //If the asset isnt on rarity tools, try luckytrader
    if(element==""){
        await page.goto(`https://www.nft-stats.com/rarity/${slug}#details=${nftId}`,{"waitUntil" : "networkidle0"})
        const pageData = await page.evaluate(()=>{
            return {
                html:document.documentElement.innerHTML
            }
        })
        $ = cheerio.load(pageData.html)
        element = $('#rarityDiv > div > div > main > div.modal.fade.show > div > div > span > h5 > small > span').text()
    }else{
        element=element.text().split(' ')[2]
    }
    if(element=='null'){element='unknown'}
    await page.close()
    await browser.close()
    return element
})
    // const pageData = await page.evaluate(()=>{
    //     return {
    //         html:document.documentElement.innerHTML
    //     }
    // })
    // let $ = cheerio.load(pageData.html)
    // let [element] = await page.$x('/html/body/div/div/div/div[3]/div[2]/div/div[1]/div/div[1]/div[1]/span')
    // //document.query #__layout > div > div.absolute.top-0.z-10.w-screen.h-full.lg\\:h-screen > div.absolute.z-30.justify-center.w-full.h-full.lg\\:flex.top-12.l-0.lg\\:top-0.lg\\:items-center > div > div.mx-auto.text-center.lg\\:overflow-auto.scrollColor > div > div.flex.flex-row.mx-4.mb-0\\.5.mt-2.text-lg.textColor600.overflow-hidden.items-baseline > div:nth-child(1) > span")
    // //If the asset isnt on rarity tools, try luckytrader
    // console.log(element)
    // if(element==""){
    //     await page.goto(`https://www.nft-stats.com/rarity/${slug}#details=${nftId}`,{"waitUntil" : "networkidle0"})
    //     const pageData = await page.evaluate(()=>{
    //         return {
    //             html:document.documentElement.innerHTML
    //         }
    //     })
    //     $ = cheerio.load(pageData.html)
    //     element = $('#rarityDiv > div > div > main > div.modal.fade.show > div > div > span > h5 > small > span').text()
    // }else{
    //     element = await page.evaluate(name => name.innerText, element);
    //     element=element.split(' ')[2]
    // }
    // if(element=='null'){element='unknown'}
    // await page.close()
    // await browser.close()
    // return element

module.exports={
    getRank
}

