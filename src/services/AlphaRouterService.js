const { AlphaRouter, SwapType } = require('@uniswap/smart-order-router');
const { Token, CurrencyAmount, TradeType, Percent } = require('@uniswap/sdk-core');
const { ethers, BigNumber } = require('ethers');
const JSBI = require('jsbi');
const ERC20ABI = require('./../abi.json');

const V3_SWAP_ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
const REACT_APP_INFURA_URL_TESTNET = process.env.REACT_APP_INFURA_URL_TESTNET;

const chainId = 5;
//80001;

const web3Provider = new ethers.providers.JsonRpcProvider(REACT_APP_INFURA_URL_TESTNET);
const router = new AlphaRouter({chainId: chainId, provider: web3Provider});

const name_0 = 'Wrapped Ether';
const symbol_0 = 'WETH';
const decimals_0 = 18;
const address_0 = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6';
//0xc778417e063141139fce010982780140aa0cd5ab
// '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889'; Polygon

const name_1 = 'Uniswap Token';
const symbol_1 = 'UNI';
const decimals_1 = 18;
const address_1 = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';
//0x1f9840a85d5af5bf1d1762f925bdaddc4201f984
// '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'; Polygon


const WETH = new Token(chainId, address_0, decimals_0, symbol_0, name_0);
const UNI = new Token(chainId, address_1, decimals_1, symbol_1, name_1);

export const getWethContract = () => new ethers.Contract(address_0, ERC20ABI, web3Provider);
export const getUniContract = () => new ethers.Contract(address_1, ERC20ABI, web3Provider);


export const getPrice = async (inputAmount, slippageAmount, deadline, walletAddress) => {
    const percentSlippage = new Percent(slippageAmount, 100);
    const wei = ethers.utils.parseUnits(inputAmount.toString(), decimals_0); 
    const currencyAmount = CurrencyAmount.fromFractionalAmount(WETH, JSBI.BigInt(wei));

    const route = await router.route(
        currencyAmount,
        UNI,
        TradeType.EXACT_INPUT,
        {
            type: SwapType.UNIVERSAL_ROUTER,
            recipient: walletAddress,
            slippageTolerance: percentSlippage,
            deadline: deadline,
        }
    )
    const transaction = {
        data: route.methodParameters.calldata,
        to: V3_SWAP_ROUTER_ADDRESS,
        value: BigNumber.from(route.methodParameters.value),
        from: walletAddress,
        gasPrice: BigNumber.from(route.gasPriceWei),
        gasLimit: ethers.utils.hexlify(1000000)
    }

    const quoteAmountOut = route.quote.toFixed(6);
    const ratio = (inputAmount/quoteAmountOut).toFixed(6);

    return [
        transaction,
        quoteAmountOut,
        ratio
    ]
}

export const runSwap = async (transaction, signer) => {
    const approvalAmount = ethers.utils.parseUnits('10', 18).toString();
    const contract_0 = getWethContract();
    await contract_0.connect(signer).approve(
        V3_SWAP_ROUTER_ADDRESS,
        approvalAmount
    )

    signer.sendTransaction(transaction);
}


