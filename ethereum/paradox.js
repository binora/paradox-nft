import web3 from './web3'

const compiled = require('./build/Paradox.json');

const getInstance = (address) => {
    return new web3.eth.Contract(
        compiled.abi,
        address
    );
}


export default getInstance;
