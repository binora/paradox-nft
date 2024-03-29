import React, { useEffect } from "react";
import { useState } from "react";

import paradox from '../ethereum/paradox';

import {
    Input,
    StatGroup,
    Stat,
    StatNumber,
    StatLabel,
    Button,
    Image,
    Flex,
    Divider,
} from "@chakra-ui/react";

import web3 from "../ethereum/web3";

const containerStyle = {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginTop: "20px"
}

const mintStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "90%"
}

const questionStyle = {
    display: "flex",
    gap: "20px",
}

const defaultState = {
    guess: "",
    loading: false,
    errorMessage: "",
    isCorrect: false,
    isMinting: false,
    isMintingWithoutAnswer: false,
    account: "",
}

const genHash = (guess, from) => {
    const encryptedGuess = web3.utils.keccak256(guess);
    const encodedGuess = web3.eth.abi.encodeParameters(["string", "address"], [encryptedGuess, from]);
    return web3.utils.keccak256(encodedGuess);
}


const Level = (props) => {
    const { level, gameInfo } = props
    const { id, mintsSoFar, mintsWithoutAnswer, imageURL } = level;
    const {
        itemsPerLevel,
        maxPricePerItem,
        pricePerItem,
        maxPurchasesWithoutAnswerPerLevel,
    } = gameInfo

    const [state, setState] = useState(defaultState)

    const onChange = (e) => {
        setState((prevState) => {
            return {
                ...prevState,
                guess: e.target.value
            }
        });
    }

    const checkAnswer = async () => {
        setState((prevState) => {
            return {
                ...prevState,
                loading: true
            }
        });


        const answerHash = genHash(state.guess, state.account)
        try {
            const isCorrect = await paradox.methods.checkAnswer(id, answerHash).call({ from: state.account });
            setState((prevState) => {
                return {
                    ...prevState,
                    loading: false,
                    isCorrect,
                }
            });
        } catch (err) {
            setState((prevState) => {
                return {
                    ...prevState,
                    loading: false,
                    isCorrect: false,
                    errorMessage: err
                }
            });
        }
    }

    const mint = async (guess) => {
        setState((prevState) => {
            return {
                ...prevState,
                isMinting: true,
            }
        });

        const answerHash = genHash(guess, state.account);
        const quantity = 1;

        try {
            await paradox.methods.mint(id, answerHash, quantity)
                .send({
                    value: pricePerItem * quantity,
                    from: state.account,
                })
            setState((prevState) => {
                return {
                    ...prevState,
                    isMinting: false,
                    isMintingWithoutAnswer: false
                }
            })

        } catch (err) {
            setState((prevState) => {
                return {
                    ...prevState,
                    isMinting: false,
                    isMintingWithoutAnswer: false,
                    errorMessage: err
                }
            })
        }
    }

    const mintWithoutAnswer = async () => {
        setState((prevState) => {
            return {
                ...prevState,
                isMintingWithoutAnswer: true,
            }
        });
        const quantity = 1;
        try {
            await paradox.methods.mint(id, "0x0", quantity)
                .send({
                    value: maxPricePerItem * quantity,
                    from: state.account,
                })
            setState((prevState) => {
                return {
                    ...prevState,
                    isMintingWithoutAnswer: false
                }
            })

        } catch (err) {
            setState((prevState) => {
                return {
                    ...prevState,
                    isMintingWithoutAnswer: false,
                    errorMessage: err
                }
            })
        }
    }


    useEffect(async () => {
        await window.ethereum.enable();
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setState(prevState => ({ ...prevState, account: accounts[0] }))
        window.ethereum.on('accountsChanged', function (accounts) {
            setState(prevState => ({ ...prevState, account: accounts[0] }))
        });
    }, [])

    return (
        <div style={containerStyle}>
            <div style={questionStyle}>
                <div style={mintStyle}>
                    <Image src={imageURL} height="80%" />
                    <Flex justifyContent="space-between">
                        <Input
                            value={state.guess}
                            placeholder='Type your answer here'
                            onChange={onChange}
                            width="50%"
                        >
                        </Input>
                        <Button
                            color="twitter"
                            onClick={checkAnswer}
                            loading={state.loading}
                        >
                            Check Answer
                        </Button>
                        <Button
                            disabled={!state.isCorrect}
                            primary
                            onClick={() => mint(state.guess)}
                            loading={state.isMinting}
                        >
                            Mint for {web3.utils.fromWei(pricePerItem, 'ether')} ETH
                        </Button>
                        <Divider orientation="vertical" />
                        <Button
                            loading={state.isMintingWithoutAnswer}
                            color="orange"
                            onClick={() => mintWithoutAnswer()}
                        >
                            Mint for {web3.utils.fromWei(maxPricePerItem, 'ether')} ETH
                        </Button>
                    </Flex>
                </div>
                <StatGroup
                    flexDirection="column"
                    marginTop="20%"
                    marginBottom="20%"
                    maxHeight="100%"
                    marginLeft="1%"
                >
                    <Stat>
                        <StatLabel>Total Mints</StatLabel>
                        <StatNumber>
                            {mintsSoFar} / {itemsPerLevel}
                        </StatNumber>
                    </Stat>
                    <Stat>
                        <StatLabel>Expensive Mints</StatLabel>
                        <StatNumber>
                            {mintsWithoutAnswer} / {maxPurchasesWithoutAnswerPerLevel}
                        </StatNumber>
                    </Stat>
                </StatGroup>
            </div>

        </div >
    )
}

export default Level;