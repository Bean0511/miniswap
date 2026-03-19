// SPDX-License-Identifier: MIT

// contracts/core/MiniswapFactory.sol
pragma solidity ^0.8.28;

import "./MiniswapPair.sol";

contract MiniswapFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "MiniswapFactory: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "MiniswapFactory: ZERO_ADDRESS");
        require(getPair[token0][token1] == address(0), "MiniswapFactory: PAIR_EXISTS");

        bytes memory bytecode = type(MiniswapPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        MiniswapPair(pair).initialize(token0, token1);

        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // 反向映射
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }
}