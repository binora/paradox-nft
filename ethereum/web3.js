import Web3 from 'web3';

let web3;

const goerliURL = 'https://goerli.infura.io/v3/183f4e12889e4f81ab9567edfd2fd64d';
const ganacheURL = 'http://127.0.0.1:8545'

if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
    web3 = new Web3(window.web3.currentProvider || window.ethereum);
} else {
    const provider = new Web3.providers.HttpProvider(ganacheURL);
    web3 = new Web3(provider);
}


export default web3;