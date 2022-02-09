const assert = require('assert');
const ganache = require('ganache-cli');

const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledParadox = require('../bin/ethereum/contracts/paradox.json');
const compiledMinter = require('../bin/ethereum/contracts/minter.json');

const defaultBaseURI = "http://example.com";
const defaultGas = '2999999';

const totalItems = 9;
const itemsPerLevel = 3;
const maxPurchasesWithoutAnswerPerLevel = 2;

let accounts;
let paradox;
let owner;

let minter;

const testData = {
    levelImageURL: "http://sampleURL",
    answerHash: "0x746573745b38da6a701c568545dcfcb03fcb875f56beddc4"
}

const setPaused = async (paused) => {
    await paradox.methods.setPaused(paused)
        .send({ from: owner, gas: defaultGas });
}

const createLevel = async () => {
    await paradox.methods.createLevel(testData.levelImageURL, testData.answerHash)
        .send({ from: owner, gas: defaultGas });
}

const generateGuess = (guess, from) => {
    const encodedGuess = web3.eth.abi.encodeParameters(["string", "address"], [guess, from]);
    return web3.utils.keccak256(encodedGuess);
}

const mintNFT = async (levelIndex, answer, quantity, from, ether) => {
    const guess = generateGuess(answer, from)
    await paradox.methods.mint(levelIndex, guess, quantity)
        .send(
            {
                from: from,
                gas: defaultGas,
                value: web3.utils.toWei(ether, 'ether')
            })
}

const assertErrReason = (err, reason) => {
    assert(err);
    const tx = Object.keys(err.results)[0]
    assert(err.results[tx].reason.includes(reason));
}

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();
    owner = accounts[0];

    paradox = await new web3.eth.Contract(compiledParadox.abi)
        .deploy({
            data: compiledParadox.bytecode,
            arguments: [defaultBaseURI, totalItems, itemsPerLevel, maxPurchasesWithoutAnswerPerLevel],
        })
        .send({ from: owner, gas: defaultGas });

    minter = await new web3.eth.Contract(compiledMinter.abi)
        .deploy({
            data: compiledMinter.bytecode,
            arguments: [paradox.options.address],
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
            assertErrReason(err, "Ownable: caller is not the owner")
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
            assertErrReason(err, "Ownable: caller is not the owner")
        }

        await paradox.methods.setBaseURI(newBaseURI)
            .send({ from: owner, gas: defaultGas });

        const result = await paradox.methods.baseURI().call()
        assert.equal(result, newBaseURI);
    })
})

describe("Paradox game tests", () => {
    it("does not allow creating new level if not paused", async () => {
        await paradox.methods.setPaused(false)
            .send({ from: owner, gas: defaultGas });

        try {
            await paradox.methods.createLevel(testData.levelImageURL, testData.answerHash).send({ from: owner, gas: defaultGas });
            assert(false)
        } catch (err) {
            assertErrReason(err, "Method invocation requires the game to be paused")
        }
    });

    it("does not allow non-admin to create a new level", async () => {
        const nonAdmin = accounts[1];
        await paradox.methods.setPaused(true)
            .send({ from: owner, gas: defaultGas });

        try {
            await paradox.methods.createLevel(testData.levelImageURL, testData.answerHash)
                .send({ from: nonAdmin, gas: defaultGas });
            assert(false)
        } catch (err) {
            assertErrReason(err, "This account does not have permission to perform this action")
            assert(err)
        }
    })

    it("does not allow creating a level with empty image url", async () => {
        try {
            await paradox.methods.createLevel("", testData.answerHash)
                .send({ from: owner, gas: defaultGas });
            assert(false);
        } catch (err) {
            assertErrReason(err, "Image url cannot be empty")
        }
    })

    it("does not allow creating a level with empty answer hash", async () => {
        try {
            await paradox.methods.createLevel(testData.levelImageURL, "")
                .send({ from: owner, gas: defaultGas });
            assert(false);
        } catch (err) {
            assertErrReason(err, "Answer hash cannot be empty")
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

        const guess = generateGuess(testData.answerHash, accounts[1]);

        const isCorrect = await paradox.methods.checkAnswer(1, guess).call({ from: accounts[1] });
        assert(isCorrect)
    });

    it('does not allow updating a level when the game is on', async () => {
        await setPaused(false);

        try {
            await paradox.methods.updateLevel(1, true, testData.levelImageURL)
                .send({ from: owner, gas: defaultGas });
            assert(false);
        } catch (err) {
            assertErrReason(err, "Method invocation requires the game to be paused")
        }
    })

    it("does not allow updating out of bound levels", async () => {
        await setPaused(true);
        await createLevel();

        try {
            await paradox.methods.updateLevel(0, true, testData.levelImageURL)
                .send({ from: owner, gas: defaultGas })
            assert(false)
        } catch (err) {
            assertErrReason(err, "Invalid level index")
        }

        try {
            await paradox.methods.updateLevel(2, true, testData.levelImageURL)
                .send({ from: owner, gas: defaultGas })
            assert(false)
        } catch (err) {
            assertErrReason(err, "Invalid level index")
        }
    })
})

describe("Paradox mint tests", () => {
    it("does not allow users to mint when contract is paused", async () => {
        await setPaused(true);
        await createLevel();

        try {
            await paradox.methods.mint(1, generateGuess("test", owner), 1)
                .send({ from: owner, gas: defaultGas })
            assert(false)
        } catch (err) {
            assertErrReason(err, "Game is paused. Please try again later");
        }
    })

    it("does not allow a contract to mint an NFT", async () => {
        await createLevel();
        await setPaused(false);

        try {
            await minter.methods.mint(1, generateGuess("test", minter.options.address), 1)
                .send({ from: owner, gas: defaultGas })
            assert(false);
        } catch (err) {
            assertErrReason(err, "Contracts are not allowed to mint NFTs")
        }
    })

    it("does not allow users to mint after the sale is over", async () => {
        const iterations = Array.from({ length: 9 }, (v, k) => k + 1)
        await setPaused(true);
        for (index of iterations) {
            await createLevel();
        }
        await setPaused(false);
        for (index of iterations) {
            await mintNFT(index, testData.answerHash, 1, accounts[index], '0.03');
        }

        const lastUser = accounts[9];
        try {
            await mintNFT(1, testData.answerHash, 1, lastUser, '0.03');
            assert(false);
        } catch (err) {
            assertErrReason(err, "Sorry, all Items are sold out");
        }
    })

    it("does not allow minting uninitialized levels", async () => {
        await setPaused(true);
        await createLevel();
        await paradox.methods.updateLevel(1, false, testData.levelImageURL)
            .send({ from: owner, gas: defaultGas })

        await setPaused(false);

        try {
            await mintNFT(1, testData.answerHash, 1, accounts[1], '0.03');
            assert(false);
        } catch (err) {
            assertErrReason(err, "Unknown level")
        }
    })

    it("does not allow users to mint more than predefined items per level", async () => {
        await setPaused(true);
        await createLevel();

        await setPaused(false);

        // mint 3 items
        await mintNFT(1, testData.answerHash, 2, accounts[1], '0.07');
        await mintNFT(1, testData.answerHash, 1, accounts[2], '0.03');

        try {
            await mintNFT(1, testData.answerHash, 1, accounts[2], '0.03');
            assert(false);
        } catch (err) {
            assertErrReason(err, "All items have been minted for this level");
        }
    })

    it("does not allow users to mint if not minteable items are left in the level", async () => {
        await createLevel();
        await setPaused(false);

        // mint 2 times
        await mintNFT(1, testData.answerHash, 2, accounts[1], '0.07');

        try {
            await mintNFT(1, testData.answerHash, 2, accounts[2], '0.07');
            assert(false);
        } catch (err) {
            assertErrReason(err, "Not enough minteable items left in this level")
        }
    })

    it("does not allow a user to mint after their max purchase limit per level is reached", async () => {
        await createLevel();
        await setPaused(false);

        // mint 2 times
        await mintNFT(1, testData.answerHash, 2, accounts[1], '0.07');
        try {
            await mintNFT(1, testData.answerHash, 1, accounts[1], '0.03');
            assert(false)
        } catch (err) {
            assertErrReason(err, "Max purchase limit for user reached for this level")
        }
    })

    it("allows a user to mint without answer if they pay the maxPrice per item", async () => {
        await createLevel();
        await setPaused(false);

        await mintNFT(1, "", 2, accounts[1], "2.2");

        let tokenOwner1 = await paradox.methods.ownerOf(0).call()
        let tokenOwner2 = await paradox.methods.ownerOf(1).call()
        assert.equal(tokenOwner1, accounts[1])
        assert.equal(tokenOwner2, accounts[1])
    })

    it("does not allow a user to mint without answer if purchase-limit-without-answer is already reached", async () => {
        await createLevel();
        await setPaused(false);

        await mintNFT(1, "", 1, accounts[1], "2.2");
        await mintNFT(1, "", 1, accounts[2], "2.2");
        try {
            await mintNFT(1, "", 1, accounts[3], '1.2');
            assert(false)
        } catch (err) {
            assertErrReason(err, "Exceeded purchase-without-answer limit");
        }
    })

    it("does not allow users to mint with incorrect answer", async () => {
        await createLevel();
        await setPaused(false);

        try {
            await mintNFT(1, "wrong answer", 1, accounts[1], "0.03");
            assert(false);
        } catch (err) {
            assertErrReason(err, "Incorrect answer");
        }
    })

    it("allows a user to mint an nft with the correct answer", async () => {
        await createLevel();
        await setPaused(false);
        await mintNFT(1, testData.answerHash, 1, accounts[1], "0.03");

        let tokenOwner = await paradox.methods.ownerOf(0).call()
        assert.equal(tokenOwner, accounts[1]);
    })
});


