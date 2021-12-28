const ethers = require('ethers');

const { ContractAddress } = require("./config/ContractAddress")
const { Config } = require("./config/Config")
const { ABI_PancakeRouter } = require("./abi/PancakeRouter")

const PROVIDER = new ethers.providers.JsonRpcProvider(Config.HTTP_PROVIDER_LINK);
const PROVIDER_WS = new ethers.providers.WebSocketProvider(Config.WSS_PROVIDER_LINK);
const provider = PROVIDER_WS // Select the Provider what you want to use.

// Wallet and Config PrivateKey
const PRIVATE_KEY = Config.PrivateKey
const SLIPPAGE = Config.Slippage
const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

// Factory and Router Contract
const FactoryContract = new ethers.Contract(ContractAddress.PancakeFactory, [
    'function getPair(address tokenA, address tokenB) external view returns (address pair)'
], provider);

const RouterContract = new ethers.Contract(ContractAddress.PancakeRouter, ABI_PancakeRouter, wallet);

// Token and WBNB Contract
const TOKEN = new ethers.Contract(ContractAddress.TOKEN, [
    'function balanceOf(address account) external view returns (uint256)',
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address _owner, address spender) external view returns (uint256)',
    'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
    'function symbol() external view returns (string memory)'
], wallet);

const BNB = new ethers.Contract(ContractAddress.BNB, [
    'function balanceOf(address account) external view returns (uint256)',
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address _owner, address spender) external view returns (uint256)'
], wallet);

const WBNB = new ethers.Contract(ContractAddress.WBNB, [
    'function balanceOf(address account) external view returns (uint256)',
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address _owner, address spender) external view returns (uint256)'
], wallet);

const BUSD = new ethers.Contract(ContractAddress.BUSD, [
    'function balanceOf(address account) external view returns (uint256)',
    'function approve(address spender, uint256 amount) external returns (bool)',
    'function allowance(address _owner, address spender) external view returns (uint256)'
], wallet);

async function main() {

    // Define
    let checkLiquidity = Config.CheckLiquidity
    let pairContract = "0x0000000000000000000000000000000000000000"
    let foundPairAddress = false
    let foundLiquidity = false
    let buying = false
    let buySuccess = false

    // Prepair
    console.log(`Wallet Address : ${wallet.address}`)
    console.log(`Balance : ${ethers.utils.formatUnits(await wallet.getBalance())} BNB`)
    const tokenSymbol = await TOKEN.symbol()
    console.log(`Token Symbol : ${tokenSymbol}`)

    // Allowance, Approve Token
    TOKEN.allowance(wallet.address, ContractAddress.PancakeRouter).then(allowance => {
        if (Number(allowance) !== 0) return
        TOKEN.approve(ContractAddress.PancakeRouter, "115792089237316195423570985008687907853269984665640564039457584007913129639935").then(trx => {
            console.log(`Approving Token...\n${trx.hash}`)
        }).catch(err => {
            console.log(`Approve Error`)
            console.log(err)
        })
    })
    
    // Listening on block number
    provider.on("block", async (blockNumber) => {
        console.log(blockNumber)

        // Finding for the PairContract
        if (!foundPairAddress) {
            pairContract = await FactoryContract.getPair(ContractAddress.WBNB, ContractAddress.TOKEN);
            console.log(`Waiing for Pair Address...`)
            if (pairContract !== "0x0000000000000000000000000000000000000000") {
                console.log(`Pair Address is:  ${pairContract}`)
                foundPairAddress = true
            }
        }

        // Checking for the Liquidity
        if (!foundLiquidity && (checkLiquidity && foundPairAddress)) {
            const PairContract = new ethers.Contract(pairContract, [
                'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
            ], wallet);
            /*
            PairContract.getReserves().then((pairReserveData) => {
                console.log(`Waiting for liquidity pool : [${pairReserveData[0]}] [${pairReserveData[1]}] [${pairReserveData[2]}]`)
                if(Number(pairReserveData[0]) === 0) return
                if(Number(pairReserveData[1]) === 0) return
                //if(Number(pairReserveData[2]) === 0) return
                foundLiquidity = true
            })
            */
            const pairReserveData = await PairContract.getReserves()
            console.log(`Waiting for liquidity pool : [${pairReserveData[0]}] [${pairReserveData[1]}] [${pairReserveData[2]}]`)
            if (Number(pairReserveData[0]) === 0) return
            if (Number(pairReserveData[1]) === 0) return
            foundLiquidity = true
        }

        

        // Buy
        if (!buySuccess && foundPairAddress && (foundLiquidity || !checkLiquidity)) {
            // Swapping
            // swapExactTokensForTokensSupportingFeeOnTransferTokens
            // swapExactETHForTokens
            
            if (!buying) {
                const BNBAmountToPay = ethers.utils.parseUnits(Config.BNB_USE_AMT);
                const estimateTokenReceive = await RouterContract.getAmountsOut(BNBAmountToPay, [WBNB.address, TOKEN.address]);

                const minTokenReceive = Number(Number(estimateTokenReceive[1]) - Number(estimateTokenReceive[1]) * SLIPPAGE / 100); // set minimum Token receive
                console.log(`Swapping ${ethers.utils.formatUnits(BNBAmountToPay.toString())} BNB for ${ethers.utils.formatUnits(estimateTokenReceive[1].toString())} ${tokenSymbol}`)

                if (Config.IGNORE_SLIPPAGE) {
                    minTokenReceive = 0
                }

                const deadline = Math.floor(new Date().getTime() / 1000) + 60 * 10; // 10 minutes from now 
                const buyTrx = await RouterContract.swapExactETHForTokens(
                    minTokenReceive.toString(),
                    [WBNB.address, TOKEN.address],
                    wallet.address,
                    deadline,
                    {
                        value: BNBAmountToPay,
                        gasPrice: ethers.utils.parseUnits(Config.GAS, 'gwei'),
                        gasLimit: Config.GASLIMIT
                    }
                );
                buying = true
                console.log('Transaction hash is:', buyTrx.hash);
                try {
                    receipt = await buyTrx.wait();
                    if (receipt.status === 1) {
                        buySuccess = true
                        buying = false
                        console.log('Transaction confirmed.');
                        provider.off("block")
                    }
                } catch (err) {
                    buySuccess = false
                    buying = false
                    console.log('Transaction rejected.');
                    provider.off("block")
                    console.log(err)
                }
            }
        }
    })

}

main()
