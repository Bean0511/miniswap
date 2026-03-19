'use client';

import { useWeb3 } from '@/context/Web3Context';

export default function ConnectButton() {
  const { account, connect, disconnect, isConnecting } = useWeb3();

  if (account) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">
          {account.slice(0, 6)}...{account.slice(-4)}
        </span>
        <button
          onClick={disconnect}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}