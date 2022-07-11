const { OpenSeaPort, Network } = require('opensea-js')
const apiKey = process.env.OPENSEA_ACCESS_TOKEN
const options = {
    method: 'GET',
    headers: {Accept: 'application/json', 'X-API-KEY': apiKey},
    retries: 2,
    retryDelay : 4000,
}

const getAssetStats = async (asset) => {

    const response = await fetch(`https://api.opensea.io/api/v1/collection/${asset}/stats`, options)
    
    const target = await response.json()
    if(target.success == false){
        throw new Error("Target asset not found!")
    }
    return target.stats
}

const getAssetCollectionData = async (asset) => {
    return new Promise(function(resolve,reject){
    setTimeout(resolve,5000)}).then(async function(){
        const response = await fetch(`https://api.opensea.io/api/v1/collection/${asset}`, options)
        const target = await response.json()
        if(target.success == false || !target){
            throw new Error("Target asset not found!")
        }
        return {
            name:target.collection.name.replace(/\s/g, ''),
            twitter:target.collection.twitter_username
        }
    },4100)
}

module.exports={
    getAssetStats,
    getAssetCollectionData
}