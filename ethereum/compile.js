const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');

// remove build folder
const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

const paradoxPath = path.resolve(__dirname, 'contracts', 'Paradox.sol');
const source = fs.readFileSync(paradoxPath, 'utf-8');

var input = {
    language: 'Solidity',
    sources: {
        'Paradox.sol' : {
            content: source
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': [ '*' ]
            }
        }
    }
};

const output = JSON.parse(solc.compile(JSON.stringify(input))).contracts['Paradox.sol'];

fs.ensureDirSync(buildPath);

for (let contract in output) {
    fs.outputJSONSync(
        path.resolve(buildPath, contract + '.json'),
        output[contract]
    );
}


