const { OpenSeaStreamClient } = require('@opensea/stream-js')
const WebSocket = require('ws')
const {sendTweet} = require('./twitter')
const {getAssetStats, getAssetCollectionData} = require('./openseaRest')
const {getRank} = require('./rarityCalculator')
const fs = require('fs');
const express = require('express')
const app = express()
const {sendDiscordUpdate} = require('./discord')
const {channelIds} = require('./collections')

const log = fs.createWriteStream('./log.txt', { flags: 'a' });

const port = process.env.PORT
app.listen(port, ()=>{
    console.log("Server is up on port " + port)
} )

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
},600000)//ten minutes

//Converts list price based on payment token chain
const convertPrice = (priceString,decimals)=>{
    return parseInt(priceString) / 10**decimals
}

openseaClient.connect();

const getEmoji = (percent)=>{
    const len = percent / 10
    let r =''
    for(i=0; i<len;i++)
        r+='🚀' 
    return r
}
//sendDiscordUpdate('invisiblefriends','Update')
const itemListListener =  (asset) => {
    openseaClient.onItemListed(asset, (listedItem) => {
        getAssetStats(asset).then( async (collectionStats)=>{
            let weeklyAverage = collectionStats.seven_day_average_price //seven_day_average_price // one_day_average_price
            let listPrice = convertPrice(listedItem.payload.base_price, listedItem.payload.payment_token.decimals)
            console.log(asset+'\n')
            let assetCollectionData = await getAssetCollectionData(asset)
            let asset_name = assetCollectionData.name
            let symbol = listedItem.payload.payment_token.symbol
            let link = listedItem.payload.item.permalink
            let percentOff = parseFloat((Math.abs(weeklyAverage-listPrice) / ((weeklyAverage+listPrice) / 2) * 100).toFixed(2))
            let emojis = getEmoji(percentOff)
            
            let blacklisted = blacklist.includes(listedItem.payload.item.nft_id)
            if(listPrice < weeklyAverage && listedItem.payload.listing_type==="dutch" && percentOff >= 8 && !blacklisted){
                let rank = ""
                try{rank = (await getRank(listedItem)).replace('#','')
                }catch(e){console.log(e)}
                if (rank!=""){
                    rank = '\n💎 Rarity Rank: '+rank + ' / ' + collectionStats.total_supply
                }
                let tweet = `🔥 JUST LISTED! #${asset_name} \n💵 Price: ${parseFloat(listPrice.toFixed(3))} ${symbol}${rank}\n\nThat's ${percentOff}% below the weekly average!${hashtags}\n${emojis} ${link}`
                sendTweet(tweet)
                sendDiscordUpdate(asset,tweet)
                let fileString = (new Date()).toString()+'\n\n'+tweet+'\n*********************\n'
                console.log(fileString)
                //log.write(fileString)
                blacklist.push(listedItem.payload.item.nft_id)
                hashtags=''
            }
            console.log(`${asset_name} - ${listPrice}`)
            console.log(listedItem.payload.item.permalink)
            console.log('Blacklisted: ' + blacklisted)
        }).catch((e)=>{
            console.log(e)
        })
    })
}

//setTimeout(()=>getAssetStats(watchList[0]),4100)
const watchList = Object.keys(channelIds)
watchList.forEach((item)=> itemListListener(item))

