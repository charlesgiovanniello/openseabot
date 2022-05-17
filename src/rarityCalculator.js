const { OpenSeaPort, Network } = require('opensea-js')
const apiKey = process.env.OPENSEA_ACCESS_TOKEN
const options = {
    method: 'GET',
    headers: {Accept: 'application/json', 'X-API-KEY': apiKey}
}
/**
 * Find how many traits it has
 * rarity percentage = number of items with trait / number of items in collection
 * rarity score = 1 / rarity percentage
 * 
 * So determine the rarity score for each trait, and sum them up.
 * 
 * 
 */

 const rarityCalculator = async (event) =>{
    const contract = event.payload.item.nft_id.split('/')[1]
    const nftId = event.payload.item.nft_id.split('/')[2]
    return new Promise(function(resolve,reject){
        setTimeout(resolve,5000)}).then(async function(){
        const response = await fetch(`https://api.opensea.io/api/v1/asset/${contract}/${nftId}/?include_orders=false`, options)
        
        const target = await response.json()
        if(target.success == false || !target){
            throw new Error("Rarity score could not be calculated!")
        }
        let totalSupply = target.collection.stats.total_supply
        let rarity=0
        target.traits.forEach((trait)=>{
          rarity += 1 / (trait.trait_count / totalSupply)
        })
        return rarity
    },4100)
}

module.exports={
    rarityCalculator
}


