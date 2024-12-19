import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express()
const port = 3000;
const API_URL = "https://indexer.alph.pro/api/"

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true}));

let resultListed;
let token = [];
let symbol = [];
let cleanAlphPrice;
let amount;
let value;
let cleanToken1Price;
let BEquivalent;
let cleanToken2Price;
let token1;
let token2;
let token1Logo;
let token2Logo;

//Calculate number of token B equivalent to token A
function equivalentCalc() {
    value = cleanToken1Price * amount;
    value = value.toString();
    let valueLength = value.length;

    while (valueLength > 9) {
        value = value.substring(0, valueLength-1);
        valueLength = value.length;
    }

    BEquivalent = value / cleanToken2Price;
    BEquivalent = BEquivalent.toString();
    let BEquivalentLength = BEquivalent.length;
    while (BEquivalentLength > 14) {
        BEquivalent = BEquivalent.substring(0, BEquivalentLength-1);
        BEquivalentLength = BEquivalent.length;
    }
    return BEquivalent;
}


app.get("/", async (req, res) => {
    try {

        //Display Alephium price in bottom right box
        let responseAlph = await axios.get(API_URL + "prices/?address=tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq");
        let resultAlph = responseAlph.data;
        let alphDecimal = resultAlph.prices[0].token.decimals;
        let alphPrice = resultAlph.prices[0].price;
        let index = alphPrice.length-alphDecimal;


        function cleanPrice(alphPrice, index) {
            if (!alphPrice || isNaN(index) || index < 0 || index > alphPrice.length) {
                throw new Error("Invalid alphPrice or index for cleaning price.");
            }
            let cleanAlphPrice = alphPrice.substring(0, index) + "." + alphPrice.substring(index);
            cleanAlphPrice = cleanAlphPrice.slice(0,6);
            return cleanAlphPrice;
        }
        cleanAlphPrice = cleanPrice(alphPrice, index);
        console.log(`Alph price is: $${cleanAlphPrice}`);

        //Get listed tokens and insert into arrays "address" and "symbol".
        const responseListed = await axios.get(API_URL + "tokens/?listed=true");
        resultListed = responseListed.data.tokens;

        if (!resultListed) {
            throw new Error("Token list is not loaded yet. Please refresh the page.");
        }

        //Push listed token symbols into array for dropdown lists
        resultListed.forEach(listedToken => {
            token.push(listedToken);
        });

        token.forEach(tokenSymbol => {
            symbol.push(tokenSymbol.symbol);
        });

        
        res.render("index.ejs", { 
            cleanAlphPrice,
            symbol,
            token1: "select",
            token2: "select",
            token1Logo: "",
            token2Logo: "",
            amount: "",
            value: "",
        });
    } catch (error) {
        console.error("Failed to make GET request: ", error.message);
        res.render("index.ejs", {
            error: error.message,
        });
    }
});

app.post("/token1", async (req, res) => {
    try {
        //Isolate required data for token 1
        token1 = req.body.token1;
        const index1 = resultListed.findIndex(token => token.symbol === token1);
        if (index1 === -1) throw new Error(`Token 1 symbol "${token1}" not found.`);
        const token1Address = resultListed[index1].address;
        token1Logo = resultListed[index1].logo;
        const responseToken1 = await axios.get(API_URL + "prices/?address=" + token1Address);
        let token1Price = responseToken1.data.prices[0].price;

        //Insert decimal in appropriate place (kinda)
        let token1Decimal = responseToken1.data.prices[0].token.decimals;
        let priceLength1 = token1Price.length;
        while ( priceLength1 < 19) {
            token1Price = '0'+token1Price;
            priceLength1 = token1Price.length;
        }   

        const token1Index = token1Price.length-token1Decimal;


        function priceCleaner1(token1Price, token1index) {
            if (!token1Price || isNaN(token1Index) || token1Index < 0 || token1Index > token1Price.length) {
                throw new Error("Invalid token1Price or token1Index for cleaning price.");
            }
            let cleanToken1Price = token1Price.substring(0, token1Index) + "." + token1Price.substring(token1Index);
            cleanToken1Price = cleanToken1Price.slice(0,9);
            return cleanToken1Price;
        }
        cleanToken1Price = priceCleaner1(token1Price, token1Index);

        equivalentCalc();

        console.log(`Token 1 symbol is: ${token1}`);
        console.log(`Token  1 address is: ${token1Address}`);
        console.log(`Token 1 price is: $${cleanToken1Price}`);
        console.log(`Token value is: $${value}`);

        res.render("index.ejs", {
            cleanAlphPrice: cleanAlphPrice,
            symbol,
            token1,
            token1Logo,
            token2: req.body.token2 || "",
            token2Logo: req.body.token2Logo || "",
            amount,
            value,
            cleanToken1Price,
            BEquivalent,
        });

    } catch (error) {
        res.status(400).send(`Error: ${error.message}`);
    }
});

app.post("/token2", async (req, res) => {
    try {
        //Isolate required data for token 2
        token2 = req.body.token2;
        const index2 = resultListed.findIndex(token => token.symbol === token2);
        if (index2 === -1) throw new Error(`Token 2 symbol "${token2}" not found.`);
        const token2Address = resultListed[index2].address;
        token2Logo = resultListed[index2].logo;
        const responseToken2 = await axios.get(API_URL + "prices/?address=" + token2Address);
        let token2Price = responseToken2.data.prices[0].price;

        //Insert decimal in appropriate place (kinda)
        let token2Decimal = responseToken2.data.prices[0].token.decimals;
        let priceLength2 = token2Price.length;

        while ( priceLength2 < 19) {
            token2Price = '0'+token2Price;
            priceLength2 = token2Price.length;
        }   

        const token2Index = token2Price.length-token2Decimal;

        function priceCleaner2(token2Price, token2index) {
            if (!token2Price || isNaN(token2Index) || token2Index < 0 || token2Index > token2Price.length) {
                throw new Error("Invalid token2Price or token2Index for cleaning price.");
            }
            let cleanToken2Price = token2Price.substring(0, token2Index) + "." + token2Price.substring(token2Index);
            cleanToken2Price = cleanToken2Price.slice(0,9);
            return cleanToken2Price;
        }
        cleanToken2Price = priceCleaner2(token2Price, token2Index);

        equivalentCalc();

        console.log(`Equivalent B tokens is: ${BEquivalent}`);
        console.log(`Token 2 symbol is: ${token2}`);
        console.log(`Token  2 address is: ${token2Address}`);
        console.log(`Token 2 price is: $${cleanToken2Price}`);

        res.render("index.ejs", {
           cleanAlphPrice: cleanAlphPrice,
           symbol,
           token2,
           token2Logo,
           token1: req.body.token1 || "",
           token1Logo: req.body.token1Logo || "", 
           amount,
           value,
           BEquivalent,
        });

    } catch (error) {
        res.status(400).send(`Error: ${error.message}`);
    }
});

app.post("/tokenAmount", async (req, res) => {
    try {
        amount = req.body.enterAmount;

        if (isNaN(amount)) {
            amount = "Enter token amount";
        }

        equivalentCalc();

        console.log(`Token A amount is: ${amount}`);
        
        res.render("index.ejs", {
            amount: amount,
            symbol,
            cleanAlphPrice: cleanAlphPrice,
            token1: req.body.token1 || "",
            token1Logo: req.body.token1Logo || "", 
            token2: req.body.token2 || "",
            token2Logo: req.body.token2Logo || "",
            value,
            BEquivalent,
        });

    } catch (error) {
        res.status(400).send(`Error: ${error.message}`);
    }
});

app.post("/swap", async (req, res) => {
    try {
        //Swap chosen token order
        [token1, token2] = [token2, token1];
        [token1Logo, token2Logo] = [token2Logo, token1Logo];
        [cleanToken1Price, cleanToken2Price] = [cleanToken2Price, cleanToken1Price];

        equivalentCalc();

        console.log(`New token1 is: ${token1}`);
        console.log(`New token2 is: ${token2}`);

        res.render("index.ejs", {
            amount: amount,
            symbol,
            cleanAlphPrice: cleanAlphPrice,
            token1,
            token1Logo,
            token2,
            token2Logo,
            value,
            BEquivalent,
        });

    } catch (error) {
        res.status(400).send(`Error: ${error.message}`);
    }
});


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});


// Swap feature done. Need to clean code. 


// Push To Git 
// 1. git status
// 2. git add .
// 3. or git add filename 
// 4. git commit -m "Your message here"
// 5. git push origin master 


