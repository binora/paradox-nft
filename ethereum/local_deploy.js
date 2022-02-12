const Web3 = require('web3');

const compiledParadox = require('../bin/ethereum/contracts/paradox.json');

const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'))

const defaultBaseURI = "http://example.com";

const totalItems = 4500;
const itemsPerLevel = 300;
const maxPurchasesWithoutAnswerPerLevel = 100;


const defaultGas = '2999999';

let owner;
let paradox;

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();
    owner = accounts[0]
    console.log('Attempting to deploy from account: ', owner);

    paradox = await new web3.eth.Contract(compiledParadox.abi)
        .deploy({
            data: compiledParadox.bytecode,
            arguments: [defaultBaseURI, totalItems, itemsPerLevel, maxPurchasesWithoutAnswerPerLevel],
        })
        .send({ gas: '5000000', from: accounts[0] });

    console.log('Paradox Contract deployed to: ', paradox.options.address);
};


const setup = async () => {
    await deploy();

    const imageURL = "https://wallpaperaccess.com/full/334698.jpg"
    const answerHash = "520801d7eb7f6ba83c81f7866ff820803019025b1d347ddfe6d30dceda22d882"

    await paradox.methods.createLevel(imageURL, answerHash)
        .send({ from: owner, gas: defaultGas });
    await paradox.methods.setActiveLevel(1)
        .send({ from: owner, gas: defaultGas })

}

setup();




