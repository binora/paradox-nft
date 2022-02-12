import React from "react";
import { Button, Menu } from "semantic-ui-react";
import Link from 'next/link'

// import { hooks, metaMask } from '../connectors/metamask';


// const { useChainId, useAccounts, useError, useIsActivating, useIsActive, useProvider, useENSNames } = hooks


const menuStyle = {
    marginTop: '10px'
};

export default () => {
    // const chainId = useChainId()
    // const accounts = useAccounts()
    // const error = useError()
    // const isActivating = useIsActivating()

    // const isActive = useIsActive()

    // const provider = useProvider()
    // const ENSNames = useENSNames(provider)


    const isConnected = () => {
        if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
            return ""
        }
        return "Connect Wallet"
    }
    return (
        <Menu style={menuStyle}>
            <Link href="/">
                <a className="item">Paradox</a>
            </Link>

            <Menu.Menu position="right">
                <Link href="/">
                    <a className="item">Rules</a>
                </Link>
            </Menu.Menu>
        </Menu>
    )
}