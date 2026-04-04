import axios from "axios";

export const getGasData = async () => {
    const res = await axios.get(
        "https://api.blocknative.com/gasprices/blockprices",
        {
            headers: {
                Authorization: process.env.NEXT_PUBLIC_BLOCKNATIVE_KEY!,
            },
        }
    );
    
    const prices = res.data.blockPrices[0].estimatedPrices;

    return {
        low: Math.round(prices[0].price),
        avg: Math.round(prices[1].price),
        high: Math.round(prices[2].price),
    }
}