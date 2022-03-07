import React from "react";
import paradox from '../ethereum/paradox';

import Level from "../components/level";
import Layout from "../components/Layout";
import { Heading } from "@chakra-ui/layout";


const levelStyle = {
    marginTop: "20px"
}

const LevelIndex = (props) => {
    const { level, gameInfo } = props
    return (
        <Layout>
            <div style={levelStyle}>
                <Heading size="xl" textAlign="center">Level {level.id}</Heading>
                <Level level={level} gameInfo={gameInfo} />
            </div>
        </Layout>

    )
}

LevelIndex.getInitialProps = async () => {
    const results = await Promise.all([
        paradox.methods.activeLevel().call(),
        paradox.methods.itemsPerLevel().call(),
        paradox.methods.totalItems().call(),
        paradox.methods.maxPurchasesWithoutAnswerPerLevel().call(),
        paradox.methods.maxPricePerItem().call(),
        paradox.methods.pricePerItem().call()
    ])
    const [
        activeLevelIndex,
        itemsPerLevel,
        totalItems,
        maxPurchasesWithoutAnswerPerLevel,
        maxPricePerItem,
        pricePerItem
    ] = results;

    const level = await paradox.methods.levels(activeLevelIndex).call()

    const gameInfo = {
        itemsPerLevel,
        totalItems,
        maxPurchasesWithoutAnswerPerLevel,
        maxPricePerItem,
        pricePerItem,
    }

    return {
        level,
        gameInfo
    };
}

export default LevelIndex;