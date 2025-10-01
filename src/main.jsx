import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiConfig, createConfig } from 'wagmi';
import { InjectedConnector } from '@wagmi/connectors/injected';
import { publicProvider } from 'wagmi/providers/public';
import App from './App.jsx';

// 1. 定义 X Layer 网络 (Chain ID: 196)
const xLayer = {
  id: 196,
  name: 'X Layer',
  network: 'xlayer',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB', // 假设原生代币是 OKB
  },
  rpcUrls: {
    public: { http: ['https://rpc.xlayer.tech'] },
    default: { http: ['https://rpc.xlayer.tech'] },
  },
  blockExplorers: {
    default: { name: 'X Layer Scan', url: 'https://www.okx.com/explorer/xlayer/' },
  },
};

// 2. 配置 wagmi
const { chains, publicClient, webSocketPublicClient } = publicProvider({
  chains: [xLayer],
});

const config = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ chains }), // 用于 Metamask 等浏览器内置钱包
  ],
  publicClient,
  webSocketPublicClient,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <App />
    </WagmiConfig>
  </React.StrictMode>
);