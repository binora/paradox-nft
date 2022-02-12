import web3 from './web3'

const compiled = require('../bin/ethereum/contracts/paradox.json');

const instance = new web3.eth.Contract(
    compiled.abi,
    '0x1Ffd7e65ad706fEC053b98caE72b66733f4aE80e'
)


export default instance;
