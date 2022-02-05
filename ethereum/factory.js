import web3 from './web3';


const compiledFactory = require('./build/CampaignFactory.json');

const instance = new web3.eth.Contract(
    compiledFactory.abi,
    '0xc380247Aaf8491833b8401be776eB97c673E25c1'
);


export default instance;
