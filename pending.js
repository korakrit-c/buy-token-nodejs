const ethers = require('ethers');

const { Config } = require("./config/Config")

const PROVIDER = new ethers.providers.JsonRpcProvider(Config.HTTP_PROVIDER_LINK);
const PROVIDER_WS = new ethers.providers.WebSocketProvider(Config.WSS_PROVIDER_LINK);
const provider = PROVIDER_WS // Select the Provider what you want to use.

async function main() {
    provider.on("pending", async (tx) => {
        //console.log(tx)
        provider.getTransaction(tx).then(transaction => {
            console.log(transaction)
        })
    })
}

main()
