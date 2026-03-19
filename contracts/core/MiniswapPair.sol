// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libraries/Math.sol";
import "../libraries/UQ112x112.sol";
import "../interfaces/IMiniswapCallee.sol";

contract MiniswapPair is ERC20 {
    address public token0;
    address public token1;
    uint112 private reserve0; // 使用 uint112 以便 packed 存储
    uint112 private reserve1;
    uint32 private blockTimestampLast; // 最近一次 update 的时间戳

    uint public price0CumulativeLast;
    uint public price1CumulativeLast;
    uint public kLast; // 用于手续费保留的 k 值

    uint private constant MINIMUM_LIQUIDITY = 1000;
    event Mint(address indexed sender, uint amount0, uint amount1);
    event Burn(
        address indexed sender,
        uint amount0,
        uint amount1,
        address indexed to
    );
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    constructor() ERC20("Miniswap LP", "MLP") {
        // 防止实现合约被初始化
    }

    function initialize(address _token0, address _token1) external {
        require(
            token0 == address(0) && token1 == address(0),
            "Already initialized"
        );
        token0 = _token0;
        token1 = _token1;
    }

    // 更新储备和累计价格
    function _update(
        uint balance0,
        uint balance1,
        uint112 _reserve0,
        uint112 _reserve1
    ) private {
        require(
            balance0 <= type(uint112).max && balance1 <= type(uint112).max,
            "OVERFLOW"
        );
        uint32 blockTimestamp = uint32(block.timestamp % 2 ** 32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;
        if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
            // 累计价格 = 之前累计 + (reserve1/reserve0) * 时间差
            uint224 encodedReserve1 = UQ112x112.encode(_reserve1);
            uint224 encodedReserve0 = UQ112x112.encode(_reserve0);
            price0CumulativeLast +=
                uint(UQ112x112.uqdiv(encodedReserve1, _reserve0)) *
                timeElapsed;
            price1CumulativeLast +=
                uint(UQ112x112.uqdiv(encodedReserve0, _reserve1)) *
                timeElapsed;
        }
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = blockTimestamp;
        emit Sync(reserve0, reserve1);
    }

    // 添加流动性
    function mint(address to) external returns (uint liquidity) {
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves(); // gas 优化
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));
        uint amount0 = balance0 - _reserve0;
        uint amount1 = balance1 - _reserve1;

        uint totalSupply = totalSupply();
        if (totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY); // 永久锁定最小流动性
        } else {
            liquidity = Math.min(
                (amount0 * totalSupply) / _reserve0,
                (amount1 * totalSupply) / _reserve1
            );
        }
        require(liquidity > 0, "INSUFFICIENT_LIQUIDITY_MINTED");
        _mint(to, liquidity);

        _update(balance0, balance1, _reserve0, _reserve1);
        if (totalSupply > 0) {
            kLast = uint(reserve0) * reserve1; // 更新 kLast
        }
        emit Mint(msg.sender, amount0, amount1);
    }

    // 移除流动性
    function burn(address to) external returns (uint amount0, uint amount1) {
        address _token0 = token0;
        address _token1 = token1;
        uint balance0 = IERC20(_token0).balanceOf(address(this));
        uint balance1 = IERC20(_token1).balanceOf(address(this));
        uint liquidity = balanceOf(address(this)); // 修改这一行

        uint totalSupply = totalSupply(); // 确保 totalSupply 也是函数调用
        amount0 = (liquidity * balance0) / totalSupply;
        amount1 = (liquidity * balance1) / totalSupply;
        require(amount0 > 0 && amount1 > 0, "INSUFFICIENT_LIQUIDITY_BURNED");
        _burn(address(this), liquidity);
        _safeTransfer(_token0, to, amount0);
        _safeTransfer(_token1, to, amount1);
        balance0 = IERC20(_token0).balanceOf(address(this));
        balance1 = IERC20(_token1).balanceOf(address(this));

        _update(balance0, balance1, reserve0, reserve1);
        if (totalSupply > 0) {
            kLast = uint(reserve0) * reserve1;
        }
        emit Burn(msg.sender, amount0, amount1, to);
    }

    // 交换
    function swap(
        uint amount0Out,
        uint amount1Out,
        address to,
        bytes calldata data
    ) external {
        require(amount0Out > 0 || amount1Out > 0, "INSUFFICIENT_OUTPUT_AMOUNT");
        (uint112 _reserve0, uint112 _reserve1, ) = getReserves();
        require(
            amount0Out < _reserve0 && amount1Out < _reserve1,
            "INSUFFICIENT_LIQUIDITY"
        );

        uint balance0;
        uint balance1;
        {
            // 作用域限制，避免 stack too deep
            address _token0 = token0;
            address _token1 = token1;
            require(to != _token0 && to != _token1, "INVALID_TO");
            if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out);
            if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out);
            if (data.length > 0)
                IMiniswapCallee(to).uniswapV2Call(
                    msg.sender,
                    amount0Out,
                    amount1Out,
                    data
                );
            balance0 = IERC20(_token0).balanceOf(address(this));
            balance1 = IERC20(_token1).balanceOf(address(this));
        }
        uint amount0In = balance0 > _reserve0 - amount0Out
            ? balance0 - (_reserve0 - amount0Out)
            : 0;
        uint amount1In = balance1 > _reserve1 - amount1Out
            ? balance1 - (_reserve1 - amount1Out)
            : 0;
        require(amount0In > 0 || amount1In > 0, "INSUFFICIENT_INPUT_AMOUNT");
        {
            uint balance0Adjusted = balance0 * 1000 - amount0In * 3; // 扣除 0.3% 手续费
            uint balance1Adjusted = balance1 * 1000 - amount1In * 3;
            require(
                balance0Adjusted * balance1Adjusted >=
                    uint(_reserve0) * _reserve1 * 1000 ** 2,
                "K"
            );
        }

        _update(balance0, balance1, _reserve0, _reserve1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    // 辅助函数
    function getReserves()
        public
        view
        returns (
            uint112 _reserve0,
            uint112 _reserve1,
            uint32 _blockTimestampLast
        )
    {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    function _safeTransfer(address token, address to, uint value) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, value)
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "TRANSFER_FAILED"
        );
    }
}
