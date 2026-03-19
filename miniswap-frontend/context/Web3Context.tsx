'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';

// 定义 Context 类型
interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  account: string | null;
  chainId: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnecting: boolean;
}

const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  connect: async () => {},
  disconnect: () => {},
  isConnecting: false,
});

export const useWeb3 = () => useContext(Web3Context);

// Web3Modal 配置
const providerOptions = {
  // 可以添加 WalletConnect 等选项，这里仅使用 MetaMask（injected）
};

let web3Modal: Web3Modal;
if (typeof window !== 'undefined') {
  web3Modal = new Web3Modal({
    cacheProvider: true,
    providerOptions,
    theme: 'dark',
  });
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = async () => {
    try {
      setIsConnecting(true);
      const instance = await web3Modal.connect();
      const ethersProvider = new ethers.BrowserProvider(instance);
      const signer = await ethersProvider.getSigner();
      const account = await signer.getAddress();
      const network = await ethersProvider.getNetwork();
      const chainId = Number(network.chainId);

      setProvider(ethersProvider);
      setSigner(signer);
      setAccount(account);
      setChainId(chainId);

      // 订阅事件
      instance.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          disconnect();
        }
      });
      instance.on('chainChanged', (chainId: string) => {
        setChainId(parseInt(chainId));
        window.location.reload(); // 简单处理：刷新页面
      });
      instance.on('disconnect', () => {
        disconnect();
      });
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // 断开连接
  const disconnect = async () => {
    if (web3Modal) {
      web3Modal.clearCachedProvider();
    }
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
  };

  // 自动连接（如果有缓存）
  useEffect(() => {
    if (web3Modal && web3Modal.cachedProvider) {
      connect();
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{ provider, signer, account, chainId, connect, disconnect, isConnecting }}
    >
      {children}
    </Web3Context.Provider>
  );
}