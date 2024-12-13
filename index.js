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


app.get("/", async (req, res) => {
    try {
        //Display Alephium price in bottom right box
        let responseAlph = await axios.get(API_URL + "prices/?address=tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq");
        let resultAlph = responseAlph.data;
        let decimal = resultAlph.prices[0].token.decimals;
        let alphPrice = resultAlph.prices[0].price;
        let index = alphPrice.length-decimal;


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
        console.log(resultAlph);


        //Get listed tokens and insert into arrays "address" and "symbol".
        const responseListed = await axios.get(API_URL + "tokens/?listed=true");
        resultListed = responseListed.data.tokens;

        if (!resultListed) {
            throw new Error("Token list is not loaded yet. Please refresh the page.");
        }

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
        const token1 = req.body.token1;
        const index1 = resultListed.findIndex(token => token.symbol === token1);
        if (index1 === -1) throw new Error(`Token 1 symbol "${token1}" not found.`);
        const token1Address = resultListed[index1].address;
        const token1Logo = resultListed[index1].logo;
        console.log(`Token 1 symbol is: ${token1}`);
        console.log(`Token  1 address is: ${token1Address}`);

        res.render("index.ejs", {
            cleanAlphPrice: cleanAlphPrice,
            symbol,
            token1,
            token1Logo,
            token2: req.body.token2 || "",
            token2Logo: req.body.token2Logo || "",
        });

    } catch (error) {
        res.status(400).send(`Error: ${error.message}`);
    }
});

app.post("/token2", async (req, res) => {
    try {
        const token2 = req.body.token2;
        const index2 = resultListed.findIndex(token => token.symbol === token2);
        if (index2 === -1) throw new Error(`Token 2 symbol "${token2}" not found.`);
        const token2Address = resultListed[index2].address;
        const token2Logo = resultListed[index2].logo;
        console.log(`Token 2 symbol is: ${token2}`);
        console.log(`Token  2 address is: ${token2Address}`);

        res.render("index.ejs", {
           cleanAlphPrice: cleanAlphPrice,
           symbol,
           token2,
           token2Logo,
           token1: req.body.token1 || "",
           token1Logo: req.body.token1Logo || "", 
        });

    } catch (error) {
        res.status(400).send(`Error: ${error.message}`);
    }
});

app.post("/tokenAmount", async (req, res) => {
    try {
        const amount = req.body.enterAmount;
        
        res.render("index.ejs", {
            amount,
            cleanAlphPrice: cleanAlphPrice,
            token1: req.body.token1 || "",
            token1Logo: req.body.token1Logo || "", 
            token2: req.body.token2 || "",
            token2Logo: req.body.token2Logo || "",
        });

    } catch (error) {
        res.status(400).send(`Error: ${error.message}`);
    }
});


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

// Need /amount to pass token and tokenLogo. Ensure all inputted data gets rendered


// Push To Git 
// 1. git status
// 2. git add .
// 3. or git add filename 
// 4. git commit -m "Your message here"
// 5. git push origin main 