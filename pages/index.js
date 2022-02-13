import React from "react";
import paradox from '../ethereum/paradox';

import Level from "../components/level";
import Layout from "../components/Layout";
import { Header } from "semantic-ui-react";


const levelStyle = {
    marginTop: "40px"
}

const LevelIndex = (props) => {
    const { level, gameInfo } = props
    return (
        <Layout>
            <div style={levelStyle}>
                <Header size="huge" textAlign="center">Level {level.id}</Header>
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