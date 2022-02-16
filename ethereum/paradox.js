import web3 from './web3'

const compiled = require('../bin/ethereum/contracts/paradox.json');

const instance = new web3.eth.Contract(
    compiled.abi,
    '0xccf90647f20976E34083D8c14777F71FEB54Ec51'
)


export default instance;
