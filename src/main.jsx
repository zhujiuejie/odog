import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiConfig, createConfig, http } from 'wagmi';
import App from './App.jsx';

// 1. 配置 wagmi v2.x 推荐写法（createConfig）
const xLayer = {
  id: 196,
  name: 'X Layer',
  network: 'xlayer',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB',
  },
  rpcUrls: {
    default: { http: ['https://rpc.xlayer.tech'] },
    public: { http: ['https://rpc.xlayer.tech'] },
  },
  blockExplorers: {
    default: { name: 'X Layer Scan', url: 'https://www.okx.com/explorer/xlayer/' },
  },
};

const config = createConfig({
  chains: [xLayer],
  transports: {
    [xLayer.id]: http('https://rpc.xlayer.tech'),
  },
  ssr: false,
  // connectors: 可省略，wagmi v2.x 默认支持 Injected/MetaMask
  autoConnect: true,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <App />
    </WagmiConfig>
  </React.StrictMode>
);