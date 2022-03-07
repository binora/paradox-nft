const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');

const compiledParadox = require('../bin/ethereum/contracts/paradox.json');


const provider = new HDWalletProvider(
    '7fd7327a3bf5da3cbdde5fb6c4d0431b9b8eb1422c4cfaabcde8b26065292fba',
    'https://goerli.infura.io/v3/183f4e12889e4f81ab9567edfd2fd64d'
)

const web3 = new Web3(provider);


const getHash = () => {

    const answerHash = web3.utils.keccak256("sagar")
    console.log(answerHash)


}

getHash();




