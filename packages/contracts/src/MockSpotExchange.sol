// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ISpotExchange} from "./interfaces/ISpotExchange.sol";
import {IFeeController} from "./interfaces/IFeeController.sol";

/// @title MockSpotExchange
/// @notice TESTNET-ONLY constant-product venue. Every pool pairs one asset token with the quote
///         token (mUSD). This is a small, readable x*y=k implementation for exercising the
///         trading, quoting, slippage and fee flows of tradh. It is NOT an audited production DEX.
contract MockSpotExchange is ISpotExchange, ReentrancyGuard, Pausable, Ownable2Step {
    using SafeERC20 for IERC20;

    struct Pool {
        uint112 reserveAsset;
        uint112 reserveQuote;
        bool exists;
        uint256 totalShares;
        mapping(address => uint256) shares;
    }

    uint16 public constant MAX_LP_FEE_BPS = 100; // 1%
    uint256 private constant MINIMUM_LIQUIDITY = 1_000;

    address public immutable quoteToken;
    uint8 public immutable quoteDecimals;
    IFeeController public feeController;
    uint16 public lpFeeBps;

    mapping(address => Pool) private _pools;
    address[] public listedAssets;

    event PoolCreated(address indexed asset);
    event LiquidityAdded(address indexed asset, address indexed provider, uint256 amountAsset, uint256 amountQuote, uint256 shares);
    event LiquidityRemoved(address indexed asset, address indexed provider, uint256 amountAsset, uint256 amountQuote, uint256 shares);
    event Swap(
        address indexed sender,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 lpFee,
        uint256 protocolFee,
        address to
    );
    event LpFeeUpdated(uint16 bps);
    event FeeControllerUpdated(address feeController);

    error ZeroAddress();
    error PoolExists();
    error PoolMissing(address asset);
    error UnsupportedPair(address tokenIn, address tokenOut);
    error InsufficientInput();
    error InsufficientLiquidity();
    error SlippageExceeded(uint256 amountOut, uint256 minAmountOut);
    error Expired(uint256 deadline);
    error FeeTooHigh();
    error Overflow();

    constructor(address owner_, address quoteToken_, uint16 lpFeeBps_) Ownable(owner_) {
        if (quoteToken_ == address(0)) revert ZeroAddress();
        if (lpFeeBps_ > MAX_LP_FEE_BPS) revert FeeTooHigh();
        quoteToken = quoteToken_;
        quoteDecimals = IERC20Metadata(quoteToken_).decimals();
        lpFeeBps = lpFeeBps_;
        emit LpFeeUpdated(lpFeeBps_);
    }

    // ---------------------------------------------------------------- admin

    function setLpFeeBps(uint16 bps) external onlyOwner {
        if (bps > MAX_LP_FEE_BPS) revert FeeTooHigh();
        lpFeeBps = bps;
        emit LpFeeUpdated(bps);
    }

    function setFeeController(address controller) external onlyOwner {
        feeController = IFeeController(controller);
        emit FeeControllerUpdated(controller);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function createPool(address asset) external onlyOwner {
        if (asset == address(0) || asset == quoteToken) revert ZeroAddress();
        if (_pools[asset].exists) revert PoolExists();
        _pools[asset].exists = true;
        listedAssets.push(asset);
        emit PoolCreated(asset);
    }

    // ------------------------------------------------------------- liquidity

    function listedAssetCount() external view returns (uint256) {
        return listedAssets.length;
    }

    function getReserves(address asset) external view returns (uint256 reserveAsset, uint256 reserveQuote) {
        Pool storage p = _pools[asset];
        if (!p.exists) revert PoolMissing(asset);
        return (p.reserveAsset, p.reserveQuote);
    }

    function sharesOf(address asset, address provider) external view returns (uint256) {
        return _pools[asset].shares[provider];
    }

    function totalShares(address asset) external view returns (uint256) {
        return _pools[asset].totalShares;
    }

    /// @notice Deposit both sides. Subsequent deposits must match the pool ratio within the
    ///         amounts supplied (the excess of the over-supplied side is not pulled).
    function addLiquidity(address asset, uint256 amountAssetDesired, uint256 amountQuoteDesired)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 amountAsset, uint256 amountQuote, uint256 shares)
    {
        Pool storage p = _pools[asset];
        if (!p.exists) revert PoolMissing(asset);
        if (amountAssetDesired == 0 || amountQuoteDesired == 0) revert InsufficientInput();

        if (p.totalShares == 0) {
            amountAsset = amountAssetDesired;
            amountQuote = amountQuoteDesired;
            shares = Math.sqrt(amountAsset * amountQuote);
            if (shares <= MINIMUM_LIQUIDITY) revert InsufficientLiquidity();
            shares -= MINIMUM_LIQUIDITY;
            p.totalShares = MINIMUM_LIQUIDITY; // permanently locked
        } else {
            uint256 quoteOptimal = (amountAssetDesired * p.reserveQuote) / p.reserveAsset;
            if (quoteOptimal <= amountQuoteDesired) {
                amountAsset = amountAssetDesired;
                amountQuote = quoteOptimal;
            } else {
                amountAsset = (amountQuoteDesired * p.reserveAsset) / p.reserveQuote;
                amountQuote = amountQuoteDesired;
            }
            shares = Math.min(
                (amountAsset * p.totalShares) / p.reserveAsset,
                (amountQuote * p.totalShares) / p.reserveQuote
            );
            if (shares == 0) revert InsufficientLiquidity();
        }

        IERC20(asset).safeTransferFrom(msg.sender, address(this), amountAsset);
        IERC20(quoteToken).safeTransferFrom(msg.sender, address(this), amountQuote);

        _setReserves(p, uint256(p.reserveAsset) + amountAsset, uint256(p.reserveQuote) + amountQuote);
        p.totalShares += shares;
        p.shares[msg.sender] += shares;
        emit LiquidityAdded(asset, msg.sender, amountAsset, amountQuote, shares);
    }

    function removeLiquidity(address asset, uint256 shares)
        external
        nonReentrant
        returns (uint256 amountAsset, uint256 amountQuote)
    {
        Pool storage p = _pools[asset];
        if (!p.exists) revert PoolMissing(asset);
        if (shares == 0 || shares > p.shares[msg.sender]) revert InsufficientLiquidity();

        amountAsset = (shares * p.reserveAsset) / p.totalShares;
        amountQuote = (shares * p.reserveQuote) / p.totalShares;
        if (amountAsset == 0 || amountQuote == 0) revert InsufficientLiquidity();

        p.shares[msg.sender] -= shares;
        p.totalShares -= shares;
        _setReserves(p, uint256(p.reserveAsset) - amountAsset, uint256(p.reserveQuote) - amountQuote);

        IERC20(asset).safeTransfer(msg.sender, amountAsset);
        IERC20(quoteToken).safeTransfer(msg.sender, amountQuote);
        emit LiquidityRemoved(asset, msg.sender, amountAsset, amountQuote, shares);
    }

    // --------------------------------------------------------------- trading

    function quoteExactIn(address tokenIn, address tokenOut, uint256 amountIn)
        public
        view
        returns (Quote memory q)
    {
        (Pool storage p, bool assetIn) = _resolve(tokenIn, tokenOut);
        if (amountIn == 0) revert InsufficientInput();
        (uint256 rIn, uint256 rOut) = assetIn
            ? (uint256(p.reserveAsset), uint256(p.reserveQuote))
            : (uint256(p.reserveQuote), uint256(p.reserveAsset));
        if (rIn == 0 || rOut == 0) revert InsufficientLiquidity();

        q.lpFee = (amountIn * lpFeeBps) / 10_000;
        q.protocolFee = address(feeController) == address(0) ? 0 : feeController.computeFee(msg.sender, amountIn);
        uint256 netIn = amountIn - q.lpFee - q.protocolFee;
        q.amountOut = (netIn * rOut) / (rIn + netIn);
        if (q.amountOut == 0 || q.amountOut >= rOut) revert InsufficientLiquidity();

        uint8 dIn = assetIn ? IERC20Metadata(tokenIn).decimals() : quoteDecimals;
        uint8 dOut = assetIn ? quoteDecimals : IERC20Metadata(tokenOut).decimals();
        // price = (out / 10^dOut) / (in / 10^dIn) scaled by 1e18
        q.spotPrice1e18 = Math.mulDiv(rOut * (10 ** dIn), 1e18, rIn * (10 ** dOut));
        q.execPrice1e18 = Math.mulDiv(q.amountOut * (10 ** dIn), 1e18, amountIn * (10 ** dOut));
        q.priceImpactBps = q.spotPrice1e18 > q.execPrice1e18
            ? ((q.spotPrice1e18 - q.execPrice1e18) * 10_000) / q.spotPrice1e18
            : 0;
    }

    function swapExactIn(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address to,
        uint256 deadline
    ) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        if (block.timestamp > deadline) revert Expired(deadline);
        if (to == address(0)) revert ZeroAddress();
        (Pool storage p, bool assetIn) = _resolve(tokenIn, tokenOut);

        Quote memory q = quoteExactIn(tokenIn, tokenOut, amountIn);
        amountOut = q.amountOut;
        if (amountOut < minAmountOut) revert SlippageExceeded(amountOut, minAmountOut);

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        if (q.protocolFee > 0) {
            IERC20(tokenIn).safeTransfer(feeController.feeRecipient(), q.protocolFee);
        }
        IERC20(tokenOut).safeTransfer(to, amountOut);

        uint256 inRetained = amountIn - q.protocolFee; // lp fee stays in the pool
        if (assetIn) {
            _setReserves(p, uint256(p.reserveAsset) + inRetained, uint256(p.reserveQuote) - amountOut);
        } else {
            _setReserves(p, uint256(p.reserveAsset) - amountOut, uint256(p.reserveQuote) + inRetained);
        }
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut, q.lpFee, q.protocolFee, to);
    }

    // -------------------------------------------------------------- internal

    function _resolve(address tokenIn, address tokenOut) internal view returns (Pool storage p, bool assetIn) {
        if (tokenIn == tokenOut) revert UnsupportedPair(tokenIn, tokenOut);
        if (tokenOut == quoteToken) {
            p = _pools[tokenIn];
            assetIn = true;
        } else if (tokenIn == quoteToken) {
            p = _pools[tokenOut];
            assetIn = false;
        } else {
            revert UnsupportedPair(tokenIn, tokenOut);
        }
        if (!p.exists) revert PoolMissing(assetIn ? tokenIn : tokenOut);
    }

    function _setReserves(Pool storage p, uint256 rAsset, uint256 rQuote) internal {
        if (rAsset > type(uint112).max || rQuote > type(uint112).max) revert Overflow();
        p.reserveAsset = uint112(rAsset);
        p.reserveQuote = uint112(rQuote);
    }
}
