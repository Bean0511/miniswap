'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/context/Web3Context';
import ConnectButton from '@/components/ConnectButton';
import { factoryABI } from '@/abis/factory';
import { routerABI } from '@/abis/router';
import { wethABI } from '@/abis/weth';

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!;
const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_ROUTER_ADDRESS!;
const WETH_ADDRESS = process.env.NEXT_PUBLIC_WETH_ADDRESS!;

export default function Home() {
  const { provider, signer, account, chainId } = useWeb3();
  const [pairCount, setPairCount] = useState<number>(0);
  const [ethBalance, setEthBalance] = useState<string>('0');

  // 读取工厂中的交易对数量
  useEffect(() => {
    if (!provider) return;
    const fetchData = async () => {
      // @ts-ignore
      const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
      const count = await factory.allPairsLength();
      setPairCount(Number(count));
    };
    fetchData();
  }, [provider]);

  // 获取账户 ETH 余额
  useEffect(() => {
    if (!account || !provider) return;
    const fetchBalance = async () => {
      const balance = await provider.getBalance(account);
      setEthBalance(ethers.formatEther(balance));
    };
    fetchBalance();
  }, [account, provider]);

  // 检查当前网络是否是 Hardhat local (chainId 31337)
  const isCorrectNetwork = chainId === 31337;

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Miniswap</h1>
        <ConnectButton />
      </div>

      {account ? (
        <>
          {!isCorrectNetwork && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
              Please switch to Hardhat local network (Chain ID 31337) in your wallet.
            </div>
          )}
          <div className="space-y-4">
            <p>Connected: {account}</p>
            <p>ETH Balance: {ethBalance}</p>
            <p>Total Pairs in Factory: {pairCount}</p>
          </div>
        </>
      ) : (
        <p>Please connect your wallet to start.</p>
      )}
    </main>
  );
}