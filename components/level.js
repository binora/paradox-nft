import React from "react";


import { Input, Image, Button, Header } from "semantic-ui-react";

const Level = (props) => {
    const { level, itemsPerLevel } = props
    const { id, mintsSoFar, mintsWithoutAnswer, imageURL } = level;

    return (
        <div style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
        }}>
            <Image src={imageURL} wrapped size="massive" />

            <div style={{display: "flex", gap: "20px"}}>
                <Input
                    label={<Button>Mint</Button>}
                    labelPosition='right'
                    placeholder='Type your answer here...'
                />

                <Header size="large"> OR</Header>

                <Button>
                    Mint with 1 ETH
                </Button>
            </div>

        </div>
    )
}

export default Level;