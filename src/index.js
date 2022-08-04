const { OpenSeaStreamClient } = require('@opensea/stream-js')
const WebSocket = require('ws')
const {sendTweet} = require('./twitter')
const {getAssetStats, getAssetCollectionData} = require('./openseaRest')
const {getRank} = require('./rarityCalculator')
const fs = require('fs')
const express = require('express')
const app = express()
const {sendDiscordUpdate} = require('./discord')
const {channelIds} = require('./collections')
const {convertEthToSol} = require('./convertEthToSol')
let blacklistFile = './src/blacklist.json'
//const log = fs.createWriteStream('./src/blacklist.json', { flags: 'a' });

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

const hashtagList = ['#web3','#nft','#nftcommunity','#crypto','#cryptocurrency','#tothemoon','#blockchain','#trading','#nftcollector','#art','#nftart']
const hashtagGenerator = ()=>{
    var arr = [];
    while(arr.length < 3){
        var r = Math.floor(Math.random() * hashtagList.length - 1) + 1;
        if(arr.indexOf(r) === -1) arr.push(r);
    }
    return `\n${hashtagList[arr[0]]} ${hashtagList[arr[1]]} ${hashtagList[arr[2]]}`
}

let blacklist

fs.readFile(blacklistFile, 'utf-8', function(err, data) {
    if (err) throw err
    var arrayOfObjects = JSON.parse(data)
    blacklist = arrayOfObjects.assets
})
console.log(blacklist)

let hashtagBlacklist=[]
let hashtags=hashtagGenerator()

setInterval(()=>{
    hashtagBlacklist = []
},600000)

setInterval(()=>{
    blacklist=[]
},86400000) //24 hours

setInterval(()=>{
    hashtags=hashtagGenerator()
},600000)//ten minutes

setInterval(()=>{

})

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
            let symbol = listedItem.payload.payment_token.symbol
            let converter = 1
            if(symbol == 'SOL'){
                converter = await convertEthToSol()
            }
            //multiply every value by converter
            let weeklyAverage = collectionStats.seven_day_average_price * converter//seven_day_average_price // one_day_average_price
            let listPrice = convertPrice(listedItem.payload.base_price, listedItem.payload.payment_token.decimals)
            if(symbol == 'SOL'){
                console.log('Weekly Average '+weeklyAverage)
                console.log('List Price '+listPrice)
                console.log(listedItem.payload)
            }
            
            let assetCollectionData = await getAssetCollectionData(asset)
            let asset_name = hashtagBlacklist.includes(assetCollectionData.name) ? assetCollectionData.name : '#'+assetCollectionData.name

            let link = listedItem.payload.item.permalink
            let percentOff = parseFloat((Math.abs(weeklyAverage-listPrice) / ((weeklyAverage+listPrice) / 2) * 100).toFixed(2))
            let emojis = getEmoji(percentOff)
            let blacklisted = blacklist.includes(listedItem.payload.item.nft_id)
            let rarityPercentile
            if(listPrice < weeklyAverage && (listedItem.payload.listing_type==="dutch" || listedItem.payload.listing_type === null || symbol=='SOL') && percentOff >= 8 && !blacklisted && !(listedItem.payload.is_private) ){
                let rank = ""
                try{
                    rank = (await getRank(listedItem)).replace('#','')
                    rarityPercentile = parseInt(rank) / parseInt(collectionStats.total_supply)
                }catch(e){
                    console.log(e)}
                if (rank!=""){
                    rank = '\n💎 Rarity Rank: '+rank.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' / ' + (collectionStats.total_supply).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                let tweet = `🔥 JUST LISTED! ${asset_name} \n${rank}\n💵 Price: ${parseFloat(listPrice.toFixed(3))} ${symbol}\n🏴‍☠️ That's ${percentOff}% below the weekly average!\n${hashtags}\n${emojis} ${link}`
                try{
                    sendDiscordUpdate(asset,tweet)
                }catch(e){
                    console.log(e)
                }
                if(rarityPercentile <= 0.3 || percentOff >=35 || symbol=='SOL' /*|| isNaN(rarityPercentile)*/){
                    sendTweet(tweet)
                    blacklist.push(listedItem.payload.item.nft_id)
                    hashtagBlacklist.push(assetCollectionData.name)
                    hashtags=''
                    
                    let obj = listedItem.payload.item.nft_id
                    fs.readFile(blacklistFile, 'utf-8', function(err, data) {
                        if (err) throw err
                    
                        var arrayOfObjects = JSON.parse(data)
                        arrayOfObjects.assets.push(obj)
                        fs.writeFile(blacklistFile, JSON.stringify(arrayOfObjects), 'utf-8', function(err) {
                            if (err) throw err
                        })
                        blacklist = arrayOfObjects.assets
                    })

                }
                let fileString = (new Date()).toString()+'\n\n'+tweet+'\n*********************\n'
                console.log(fileString)
                console.log('Rarity Percentile: ' + rarityPercentile+'\n')
            }

            console.log('\n'+asset)
            console.log(`List Price: ${listPrice}`)
            console.log('Weekly Average: '+weeklyAverage)
            console.log('Listing Type: '+listedItem.payload.listing_type)
            console.log('Percent Off: '+percentOff)
            console.log(listedItem.payload.item.permalink)
            console.log('Blacklisted: ' + blacklisted)
            console.log("Rarity Percentile: "+ rarityPercentile)
            //console.log(listedItem.payload)
        }).catch((e)=>{
            console.log(e)
        })
    })
}

//setTimeout(()=>getAssetStats(watchList[0]),4100)
const watchList = Object.keys(channelIds)
watchList.forEach((item)=> itemListListener(item))

