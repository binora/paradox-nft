const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');

const paradox = require('./build/Paradox.json');


const provider = new HDWalletProvider(
    '7fd7327a3bf5da3cbdde5fb6c4d0431b9b8eb1422c4cfaabcde8b26065292fba',
    'https://goerli.infura.io/v3/183f4e12889e4f81ab9567edfd2fd64d'
)

const web3 = new Web3(provider)

const deploy = async () => {
    const accounts = await web3.eth.getAccounts();
    console.log('Attempting to deploy from account: ', accounts[0]);

    const result = await new web3.eth.Contract(compiledFactory.abi)
        .deploy({ data: compiledFactory.evm.bytecode.object })
        .send({ gas: '5000000', from: accounts[0] });


    console.log('Factory Contract deployed to: ', result.options.address);
};


deploy();



