import Web3 from 'web3';

let web3;

if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
    web3 = new Web3(window.web3.currentProvider);
} else {
    const provider = new Web3.providers.HttpProvider(
    'https://goerli.infura.io/v3/183f4e12889e4f81ab9567edfd2fd64d'
    );
    web3 = new Web3(provider);
}


export default web3;