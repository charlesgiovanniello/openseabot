const { OpenSeaStreamClient } = require('@opensea/stream-js')
const WebSocket = require('ws')
const {sendTweet} = require('./twitter')
const {getAssetStats, getAssetCollectionData} = require('./openseaRest')
const {getRank} = require('./rarityCalculator')
const fs = require('fs');

const log = fs.createWriteStream('./log.txt', { flags: 'a' });

const openseaClient = new OpenSeaStreamClient({
    token: process.env.OPENSEA_ACCESS_TOKEN,
    connectOptions: {
      transport: WebSocket
    }
});

let blacklist=['ethereum/0xbd3531da5cf5857e7cfaa92426877b022e612cf8/1111']
let hashtags='\n#NFT #OpenSea #NFTCommunity'

setInterval(()=>{
    blacklist=[]
},86400000) //24 hours

setInterval(()=>{
    hashtags='\n#NFT #OpenSea #NFTCommunity'
},60000)//ten minutes

//Converts list price based on payment token chain
const convertPrice = (priceString,decimals)=>{
    return parseInt(priceString) / 10**decimals
}


const watchList = [
        'boredapeyachtclub',
        'doodles-official',
        'decentraland',
        'the-wanderers',
        'beanzofficial',
        'mutant-ape-yacht-club',
        'bored-ape-kennel-club',
        'cryptopunks',
        'sandbox',
        'pudgypenguins',
        'the-doge-pound',
        'cyberkongz',
        'veefriends',
        'cool-cats-nft',
        'reptilian-renegade-solana',
        'galactic-gecko-space-garage',
        'tamaki-apes',
        'where-my-vans-go',
        'portals',
        'netvrkland',
        'the-art-of-seasons',
        'invisiblefriends',
        'communi3-mad-scientists',
        'alienfrensnft',
        'mous-in-da-hous',
        'forgottenruneswizardscult',
        'psychedelics-anonymous-genesis'
    ]

openseaClient.connect();

const getEmoji = (percent)=>{
    const len = percent / 10
    let r =''
    for(i=0; i<len;i++)
        r+='🚀' 
    return r
}

const itemListListener =  (asset) => {
    openseaClient.onItemListed(asset, (event) => {
        getAssetStats(asset).then( async (result)=>{
            let weeklyAverage = result.seven_day_average_price //seven_day_average_price // one_day_average_price
            let listPrice = convertPrice(event.payload.base_price, event.payload.payment_token.decimals)
            console.log(asset)
            let assetCollectionData = await getAssetCollectionData(asset)
            let asset_name = assetCollectionData.name
            let symbol = event.payload.payment_token.symbol
            let link = event.payload.item.permalink
            let percentOff = parseFloat((Math.abs(weeklyAverage-listPrice) / ((weeklyAverage+listPrice) / 2) * 100).toFixed(2))
            let emojis = getEmoji(percentOff)
            //console.log(`Item from collection #${asset_name} was listed!\n\nPrice: ${parseFloat(listPrice.toFixed(3))} ${symbol}\n\nRarity Score: ${rarity}\n\nThat's ${percentOff}% below the weekly average!\n\n${emojis} ${link}`)
            let blacklisted = blacklist.includes(event.payload.item.nft_id)
            if(listPrice < weeklyAverage && event.payload.listing_type==="dutch" && percentOff >= 10 && !blacklisted){
                let rank = ""
                try{rank = (await getRank(event)).replace('#','')
                }catch(e){console.log(e)}
                if (rank!=""){
                    rank = '\n\n💎'+rank + ' / ' + result.total_supply
                }
                let tweet = `🔥 Deal from collection #${asset_name} was listed!\n\n💵 Price: ${parseFloat(listPrice.toFixed(3))} ${symbol}${rank}\n\nThat's ${percentOff}% below the weekly average!${hashtags}\n${emojis} ${link}`
                //sendTweet()
                let fileString = (new Date()).toString()+'\n\n'+tweet+'\n*********************\n'
                log.write(fileString)
                blacklist.push("nft_id")
                hashtags=''
            }
            console.log(`${asset_name} - ${listPrice}`)
            console.log(event.payload.item.permalink)
            console.log('Blacklisted: ' + blacklisted)
        }).catch((e)=>{
            console.log(e)
        })
    })
}
//setTimeout(()=>getAssetStats(watchList[0]),4100)

watchList.forEach((item)=> itemListListener(item))


