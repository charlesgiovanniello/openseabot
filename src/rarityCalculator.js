const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

//IIFE - Immediately Invoked function expression


const getRank = (async (event) => {
    const nftId = event.payload.item.nft_id.split('/')[2]
    const slug = event.payload.collection.slug
    const browser = await puppeteer.launch({
        headless:true,
        args: [
            '--no-sandbox',
            '--disable-dev-shm-usage', // <-- add this one
            '--disable-setuid-sandbox',
            ],
    })
    const page = await browser.newPage()

    //await page.goto(`https://rarity.tools/${slug}/view/${nftId}`,{"waitUntil" : "networkidle0"})
    await page.goto(`https://luckytrader.com/nft/${slug}/rarity?sortType=1&serialNumber=${nftId}`,{"waitUntil" : "networkidle0"})

    const pageData = await page.evaluate(()=>{
        return {
            html:document.documentElement.innerHTML
        }
    })
    const $ = cheerio.load(pageData.html)
    //const element = $('#__layout > div > div.absolute.top-0.z-10.w-screen.h-full.lg\\:h-screen > div.absolute.z-30.justify-center.w-full.h-full.lg\\:flex.top-12.l-0.lg\\:top-0.lg\\:items-center > div > div.mx-auto.text-center.lg\\:overflow-auto.scrollColor > div > div.flex.flex-row.mx-4.mb-0\\.5.mt-2.text-lg.textColor600.overflow-hidden.items-baseline > div:nth-child(1) > span')
    const element = $('.badge-pill').last().text()
    await page.close()
    await browser.close()
    return ' ' + element
})

const getRank2 = (async (event) => {
    const nftId = event.payload.item.nft_id.split('/')[2]
    const slug = event.payload.collection.slug
    const browser = await puppeteer.launch({
        headless:true
    })
    const page = await browser.newPage()

    await page.goto(`https://luckytrader.com/nft/${slug}/rarity?sortType=1&serialNumber=${nftId}`,{"waitUntil" : "networkidle0"})

    const pageData = await page.evaluate(()=>{
        return {
            html:document.documentElement.innerHTML
        }
    })
    const $ = cheerio.load(pageData.html)
    //const element = $('#__layout > div > div.absolute.top-0.z-10.w-screen.h-full.lg\\:h-screen > div.absolute.z-30.justify-center.w-full.h-full.lg\\:flex.top-12.l-0.lg\\:top-0.lg\\:items-center > div > div.mx-auto.text-center.lg\\:overflow-auto.scrollColor > div > div.flex.flex-row.mx-4.mb-0\\.5.mt-2.text-lg.textColor600.overflow-hidden.items-baseline > div:nth-child(1) > span')
    const element = $('.badge-pill').last()
    await browser.close()
    return element.text()
})



module.exports={
    getRank
}








// const { OpenSeaPort, Network } = require('opensea-js')
// const apiKey = process.env.OPENSEA_ACCESS_TOKEN
// const options = {
//     method: 'GET',
//     headers: {Accept: 'application/json', 'X-API-KEY': apiKey}
// }
//  const rarityCalculator = async (event) =>{
//     const contract = event.payload.item.nft_id.split('/')[1]
//     const nftId = event.payload.item.nft_id.split('/')[2]
//     return new Promise(function(resolve,reject){
//         setTimeout(resolve,5000)}).then(async function(){
//         const response = await fetch(`https://api.opensea.io/api/v1/asset/${contract}/${nftId}/?include_orders=false`, options)
        
//         const target = await response.json()
//         if(target.success == false || !target){
//             throw new Error("Rarity score could not be calculated!")
//         }
//         let totalSupply = target.collection.stats.total_supply
//         let rarity=0
//         target.traits.forEach((trait)=>{
//           rarity += 1 / (trait.trait_count / totalSupply)
//         })
//         return rarity
//     },4100)
// }

// module.exports={
//     rarityCalculator
// }


