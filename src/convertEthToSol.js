/* Example in Node.js */
const axios = require('axios');

let response = null;
const convertEthToSol = async() =>{
  return new Promise(async (resolve, reject) => {
    try {
      response = await axios.get('https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=ETH,SOL', {
        headers: {
          'X-CMC_PRO_API_KEY': '4d18fa8c-4a4b-4389-abb7-19ee3e7b5360',
        },
      });
    } catch(ex) {
      response = null;
      // error
      console.log(ex);
      reject(ex);
    }
    if (response) {
      // success
      const ethPrice = response.data.data.ETH[0].quote.USD.price;
      const solPrice = response.data.data.SOL[0].quote.USD.price;
      console.log(ethPrice);
      console.log(solPrice);
      console.log(ethPrice / solPrice)
      resolve(ethPrice / solPrice);
    }
  });
}

module.exports={
  convertEthToSol
}