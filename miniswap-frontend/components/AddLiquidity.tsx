'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/context/Web3Context';
import { routerABI } from '@/abis/router';
import { erc20ABI } from '@/abis/erc20';

const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_ROUTER_ADDRESS!;

export default function AddLiquidity({ tokenAddress, tokenSymbol }: { tokenAddress: string; tokenSymbol: string }) {
  const { signer, account } = useWeb3();
  const [amountToken, setAmountToken] = useState('');
  const [amountETH, setAmountETH] = useState('');
  const [approveTxHash, setApproveTxHash] = useState('');
  const [addTxHash, setAddTxHash] = useState('');
  const [loading, setLoading] = useState(false);

  // 授权
  const handleApprove = async () => {
    if (!signer || !account) return;
    try {
      setLoading(true);
      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);
      const amount = ethers.parseEther(amountToken); // 假设代币 decimals = 18
      const tx = await tokenContract.approve(ROUTER_ADDRESS, amount);
      setApproveTxHash(tx.hash);
      await tx.wait();
      alert('Approval successful');
    } catch (error) {
      console.error(error);
      alert('Approval failed');
    } finally {
      setLoading(false);
    }
  };

  // 添加流动性
  const handleAddLiquidity = async () => {
    if (!signer || !account) return;
    try {
      setLoading(true);
      const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, signer);
      const amountTokenDesired = ethers.parseEther(amountToken);
      const amountETHDesired = ethers.parseEther(amountETH);
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20分钟后过期

      // 调用 addLiquidityETH（如果 Router 有该方法）
      // 参数: token, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline
      const tx = await router.addLiquidityETH(
        tokenAddress,
        amountTokenDesired,
        0, // amountTokenMin (忽略滑点，设为0)
        0, // amountETHMin
        account,
        deadline,
        { value: amountETHDesired }
      );
      setAddTxHash(tx.hash);
      await tx.wait();
      alert('Liquidity added successfully');
    } catch (error) {
      console.error(error);
      alert('Add liquidity failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded space-y-4 mt-6">
      <h2 className="text-xl font-semibold">Add Liquidity for {tokenSymbol}</h2>
      <div>
        <label className="block text-sm">Token Amount</label>
        <input
          type="number"
          value={amountToken}
          onChange={(e) => setAmountToken(e.target.value)}
          className="border p-2 w-full"
          placeholder={`Amount of ${tokenSymbol}`}
        />
      </div>
      <div>
        <label className="block text-sm">ETH Amount</label>
        <input
          type="number"
          value={amountETH}
          onChange={(e) => setAmountETH(e.target.value)}
          className="border p-2 w-full"
          placeholder="Amount of ETH"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={loading || !amountToken}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Approve {tokenSymbol}
        </button>
        <button
          onClick={handleAddLiquidity}
          disabled={loading || !amountToken || !amountETH}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Add Liquidity
        </button>
      </div>
      {approveTxHash && (
        <p className="text-sm">Approve tx: <a href={`https://etherscan.io/tx/${approveTxHash}`} target="_blank" rel="noreferrer" className="text-blue-600 underline">{approveTxHash.slice(0, 10)}...</a></p>
      )}
      {addTxHash && (
        <p className="text-sm">Add tx: <a href={`https://etherscan.io/tx/${addTxHash}`} target="_blank" rel="noreferrer" className="text-blue-600 underline">{addTxHash.slice(0, 10)}...</a></p>
      )}
    </div>
  );
}