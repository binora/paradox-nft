import React from "react";
import { Menu } from "semantic-ui-react";
import Link from 'next/link'

const menuStyle = {
    marginTop: '10px'
};

export default () => {
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