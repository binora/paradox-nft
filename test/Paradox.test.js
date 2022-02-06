const assert = require('assert');
const ganache = require('ganache-cli')

const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledParadox = require('../bin/ethereum/contracts/paradox.json');

const defaultBaseURI = "http://example.com";
const defaultGas = '2999999';

let accounts;
let paradox;
let owner;

const testData = {
    levelImageURL: "http://sampleURL",
    answerHash: "0x746573745b38da6a701c568545dcfcb03fcb875f56beddc4"
}

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    owner = accounts[0];

    paradox = await new web3.eth.Contract(compiledParadox.abi)
        .deploy({
            data: compiledParadox.bytecode,
            arguments: [defaultBaseURI],
        })
        .send({ from: owner, gas: defaultGas });
});

describe("Paradox creation tests", () => {
    it("deploys the paradox contract", () => {
        assert.ok(paradox.options.address);
    })

    it("is paused by default after deployment", async () => {
        const paused = await paradox.methods.paused().call();
        assert(paused);
    })

    it("sets the baseURI given in the constructor after deployment", async () => {
        const baseURI = await paradox.methods.baseURI().call();
        assert.equal(baseURI, defaultBaseURI);
    })

    it("marks the contract creator as admin after deployment", async () => {
        const isAdmin = await paradox.methods.isAdmin(owner).call();
        assert(isAdmin);
    })
})

describe("Paradox Administration", () => {
    it("does not allow non-owner to change anyone's admin status", async () => {
        const nonOwner = accounts[1];
        try {
            await paradox.methods.changeAdminStatus(accounts[2], true)
                .send({ from: nonOwner, gas: defaultGas })
            assert(false);
        } catch (err) {
            assert(err);
        }
    })

    it("only allows the owner to make anyone admin", async () => {
        const sampleAccount = accounts[2];
        await paradox.methods.changeAdminStatus(sampleAccount, true)
            .send({ from: owner, gas: defaultGas });

        const isAdmin = await paradox.methods.isAdmin(sampleAccount).call();
        assert(isAdmin);
    })

    it("only allows the owner to change the paused state", async () => {
        const currentPausedState = await paradox.methods.paused().call()

        const nonOwner = accounts[1];
        try {
            await paradox.methods.setPaused(false)
                .send({ from: nonOwner, gas: defaultGas })
            assert(false);
        } catch (err) {
            assert(err);
        }

        await paradox.methods.setPaused(!currentPausedState)
            .send({ from: owner, gas: defaultGas });

        const paused = await paradox.methods.paused().call()
        assert.equal(paused, !currentPausedState);
    })

    it("only allows the owner to change the baseURI", async () => {
        const nonOwner = accounts[1];
        const newBaseURI = "http://newURL.com";
        try {
            await paradox.methods.setBaseURI("")
                .send({ from: nonOwner, gas: defaultGas })
            assert(false);
        } catch (err) {
            assert(err);
        }

        await paradox.methods.setBaseURI(newBaseURI)
            .send({ from: owner, gas: defaultGas });

        const result = await paradox.methods.baseURI().call()
        assert.equal(result, newBaseURI);
    })
})

describe("Paradox game tests", () => {
    it("does not allow creating new level if not paused", async () => {
        await paradox.methods.setPaused(true)
            .send({ from: owner, gas: defaultGas });

        try {
            await paradox.methods.createLevel(testData.levelImageURL, testData.answerHash).send({ from: owner, gas: defaultGas });
            assert(false)
        } catch (err) {
            assert(err)
        }
    });

    it("does not allow non-admin to create a new level", async () => {
        const nonAdmin = accounts[1];
        await paradox.methods.setPaused(false)
            .send({ from: owner, gas: defaultGas });

        try {
            await paradox.methods.createLevel(testData.levelImageURL, testData.answerHash)
                .send({ from: nonAdmin, gas: defaultGas });
            assert(false)
        } catch (err) {
            assert(err)
        }
    })

    it("does not allow creating a level with empty image url", async () => {
        try {
            await paradox.methods.createLevel("", testData.answerHash)
                .send({ from: owner, gas: defaultGas });
            assert(false);
        } catch (err) {
            assert(err)
        }
    })

    it("does not allow creating a level with empty answer hash", async () => {
        try {
            await paradox.methods.createLevel(testData.levelImageURL, "")
                .send({ from: owner, gas: defaultGas });
            assert(false);
        } catch (err) {
            assert(err)
        }
    })

    it("creates a new level", async () => {
        await paradox.methods.createLevel(testData.levelImageURL, testData.answerHash)
            .send({ from: owner, gas: defaultGas });

        const level = await paradox.methods.levels(1).call();
        assert.equal(level.id, '1');
        assert.equal(level.mintsSoFar, '0');
        assert.equal(level.mintsWithoutAnswer, '0');
        assert.equal(level.initialized, true);
        assert.equal(level.imageURL, testData.levelImageURL);

        // check if the answer was correctly set 
        const guess = web3.eth.abi.encodeParameters(["string", "address"], [testData.answerHash, accounts[1]]);
        const encryptedGuess = web3.utils.keccak256(guess);

        const isCorrect = await paradox.methods.checkAnswer(1, encryptedGuess).call({from: accounts[1]});
        assert(isCorrect)
    });

})


