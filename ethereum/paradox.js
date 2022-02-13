import web3 from './web3'

const compiled = require('../bin/ethereum/contracts/paradox.json');

const instance = new web3.eth.Contract(
    compiled.abi,
    '0x5e34a497fBFd2E859458Eb2168EDCE09917f172e'
)


export default instance;
