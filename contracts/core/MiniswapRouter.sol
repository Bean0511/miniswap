// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MiniswapFactory.sol";
import "./MiniswapPair.sol";
import "../libraries/TransferHelper.sol";

contract MiniswapRouter {
    address public factory;
    address public WETH;

    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH = _WETH;
    }

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, "MiniswapRouter: EXPIRED");
        _;
    }

    // 添加流动性
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    )
        external
        ensure(deadline)
        returns (uint amountA, uint amountB, uint liquidity)
    {
        // 先取 pair 地址
        address pair = MiniswapFactory(factory).getPair(tokenA, tokenB);
        require(pair != address(0), "Pair not exist");
        // 将代币转入 pair
        TransferHelper.safeTransferFrom(
            tokenA,
            msg.sender,
            pair,
            amountADesired
        );
        TransferHelper.safeTransferFrom(
            tokenB,
            msg.sender,
            pair,
            amountBDesired
        );
        // 调用 pair 的 mint
        liquidity = MiniswapPair(pair).mint(to);
        // 计算实际使用的数量
        (uint reserve0, uint reserve1, ) = MiniswapPair(pair).getReserves();
        if (tokenA < tokenB) {
            amountA =
                reserve0 -
                (IERC20(tokenA).balanceOf(pair) - amountADesired);
            amountB =
                reserve1 -
                (IERC20(tokenB).balanceOf(pair) - amountBDesired);
        } else {
            amountB =
                reserve0 -
                (IERC20(tokenA).balanceOf(pair) - amountADesired);
            amountA =
                reserve1 -
                (IERC20(tokenB).balanceOf(pair) - amountBDesired);
        }
        // 如果实际数量小于最小值则 revert
        require(
            amountA >= amountAMin && amountB >= amountBMin,
            "Insufficient amount"
        );
    }

    // 执行多跳交易
    function _swap(
        uint[] memory amounts,
        address[] memory path,
        address _to
    ) internal {
        for (uint i; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0, ) = sortTokens(input, output);
            uint amountOut = amounts[i + 1];

            // 确定 tokenOut 是 Pair 合约中的 token0 还是 token1
            (uint amount0Out, uint amount1Out) = input == token0
                ? (uint(0), amountOut)
                : (amountOut, uint(0));

            address to = i < path.length - 2
                ? pairFor(output, path[i + 2])
                : _to;
            MiniswapPair(pairFor(input, output)).swap(
                amount0Out,
                amount1Out,
                to,
                new bytes(0)
            );
        }
    }

    // 交换
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external ensure(deadline) returns (uint[] memory amounts) {
        amounts = getAmountsOut(amountIn, path);
        require(
            amounts[amounts.length - 1] >= amountOutMin,
            "Insufficient output"
        );
        TransferHelper.safeTransferFrom(
            path[0],
            msg.sender,
            pairFor(path[0], path[1]),
            amounts[0]
        );
        _swap(amounts, path, to);
    }

    // 报价函数
    function getAmountOut(
        uint amountIn,
        uint reserveIn,
        uint reserveOut
    ) public pure returns (uint amountOut) {
        require(amountIn > 0, "INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "INSUFFICIENT_LIQUIDITY");
        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = reserveIn * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

    // 返回整个路径上每个步骤的预期金额（包括输入金额）
    function getAmountsOut(
        uint amountIn,
        address[] memory path
    ) internal view returns (uint[] memory amounts) {
        require(path.length >= 2, "MiniswapRouter: INVALID_PATH");
        amounts = new uint[](path.length);
        amounts[0] = amountIn;

        for (uint i; i < path.length - 1; i++) {
            (uint reserveIn, uint reserveOut) = getReserves(
                path[i],
                path[i + 1]
            );
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    // 辅助函数：获取两个代币的储备量（需要调用对应的 Pair 合约）
    function getReserves(
        address tokenA,
        address tokenB
    ) internal view returns (uint reserveA, uint reserveB) {
        address pairAddress = pairFor(tokenA, tokenB);
        (uint reserve0, uint reserve1, ) = MiniswapPair(pairAddress)
            .getReserves();
        (address token0, ) = sortTokens(tokenA, tokenB);
        (reserveA, reserveB) = tokenA == token0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);
    }

    function sortTokens(
        address tokenA,
        address tokenB
    ) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "MiniswapRouter: IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        require(token0 != address(0), "MiniswapRouter: ZERO_ADDRESS");
    }

    function pairFor(
        address tokenA,
        address tokenB
    ) internal view returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(
            uint160(
                uint(
                    keccak256(
                        abi.encodePacked(
                            hex"ff",
                            factory,
                            keccak256(abi.encodePacked(token0, token1)),
                            keccak256(type(MiniswapPair).creationCode)
                        )
                    )
                )
            )
        );
    }
}
