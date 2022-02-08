// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Paradox.sol";

contract minter {

    paradox public paradoxAddress;

    constructor(paradox p) {
        paradoxAddress = p;
    }

    function mint(uint levelIndex, bytes32 guess, uint quantity) public returns (bool) {
        try paradoxAddress.mint(levelIndex, guess, quantity) {
            return true;
        } catch (bytes memory s) {
            revert(string(s));
        }
    }

}