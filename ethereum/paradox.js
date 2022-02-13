import web3 from './web3'

const compiled = require('../bin/ethereum/contracts/paradox.json');

const instance = new web3.eth.Contract(
    compiled.abi,
    '0x3B97771276eb9E3632cC26f27FBc3a017EcB1366'
)


export default instance;
