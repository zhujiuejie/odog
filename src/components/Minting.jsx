import React, { useState, useMemo } from 'react';
import { useAccount, useConnect, useContractWrite, usePrepareContractWrite, useBalance, useContractRead, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { CHAIN_ID, NFT_CONTRACT_ADDRESS, ODOG_TOKEN_ADDRESS, ODOG_ABI, NFT_ABI, MINT_AMOUNT } from '../constants';

function Minting() {
  const { address, isConnected, chain } = useAccount();
  // 确保连接器指向我们定义的 X Layer 网络
  const { connect } = useConnect({ connector: new InjectedConnector({ chainId: CHAIN_ID }) });
  const [message, setMessage] = useState('');
  
  // --- 1. 获取用户 ODOG 余额 ---
  const { data: balanceData } = useBalance({
    address,
    token: ODOG_TOKEN_ADDRESS,
    watch: true,
  });

  // --- 2. 检查授权额度 (Allowance) ---
  const { data: allowance } = useContractRead({
    address: ODOG_TOKEN_ADDRESS,
    abi: ODOG_ABI,
    functionName: 'allowance',
    args: [address, NFT_CONTRACT_ADDRESS],
    watch: true,
    chainId: CHAIN_ID,
  });

  const isApproved = useMemo(() => {
    if (!allowance) return false;
    // 检查授权额度是否大于或等于铸造所需数量
    return allowance >= MINT_AMOUNT;
  }, [allowance]);

  // --- 3. 授权 (Approve) 逻辑 ---
  const { config: approveConfig } = usePrepareContractWrite({
    address: ODOG_TOKEN_ADDRESS,
    abi: ODOG_ABI,
    functionName: 'approve',
    args: [NFT_CONTRACT_ADDRESS, MINT_AMOUNT],
    enabled: !isApproved && isConnected, // 只有在未授权且连接时才准备
    chainId: CHAIN_ID,
  });

  const { data: approveData, write: writeApprove } = useContractWrite(approveConfig);
  const { isLoading: isApproving } = useWaitForTransaction({ hash: approveData?.hash });

  // --- 4. 铸造 (Mint/writeMessage) 逻辑 ---
  const { config: mintConfig } = usePrepareContractWrite({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: 'writeMessage',
    args: [message],
    enabled: isApproved && isConnected && message.length > 0, // 只有在授权、连接且输入消息时才准备
    chainId: CHAIN_ID,
  });

  const { data: mintData, write: writeMint } = useContractWrite(mintConfig);
  const { isLoading: isMinting, isSuccess: isMintSuccess } = useWaitForTransaction({ hash: mintData?.hash });

  // 辅助函数
  const handleMint = () => {
    if (!writeMint) return;
    writeMint();
  };

  const handleApprove = () => {
    if (!writeApprove) return;
    writeApprove();
  };
  
  // UI 渲染逻辑
  if (!isConnected || chain?.id !== CHAIN_ID) {
    return (
      <div className="card">
        <h3>NFT 铸造墙 (X Layer)</h3>
        <p>请连接钱包，并确保网络为 **X Layer (Chain ID: 196)**。</p>
        <button onClick={() => connect()}>连接钱包</button>
      </div>
    );
  }
  
  const odogBalance = balanceData ? formatEther(balanceData.value) : '...';
  
  return (
    <div className="card">
      <h3>Odog NFT 铸造墙</h3>
      <p>铸造价格：**100 ODOG** (将被销毁)</p>
      <p>您的地址：{address.slice(0, 6)}...{address.slice(-4)}</p>
      <p>您的 ODOG 余额：**{odogBalance}**</p>

      {/* 消息输入 */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="输入您的 NFT 消息..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={100}
          style={{ width: '100%', padding: '10px' }}
        />
      </div>

      {/* 授权/铸造 流程 */}
      {!isApproved ? (
        // 授权按钮
        <button
          onClick={handleApprove}
          disabled={!writeApprove || isApproving || parseFloat(odogBalance) < 100}
        >
          {isApproving ? '授权中...' : `授权 NFT 合约花费 ${formatEther(MINT_AMOUNT)} ODOG`}
        </button>
      ) : (
        // 铸造按钮
        <button
          onClick={handleMint}
          disabled={!writeMint || isMinting || message.length === 0 || parseFloat(odogBalance) < 100}
        >
          {isMinting ? '铸造中...' : isMintSuccess ? '铸造成功！' : `铸造 NFT (销毁 100 ODOG)`}
        </button>
      )}
      
      {/* 状态反馈 */}
      {parseFloat(odogBalance) < 100 && <p style={{ color: 'red' }}>代币余额不足 100 ODOG。</p>}
      {isMintSuccess && <p style={{ color: 'green' }}>NFT 铸造成功！交易哈希: {mintData.hash.slice(0, 10)}...</p>}
      {isApproving && <p style={{ color: 'orange' }}>请在钱包中确认授权交易...</p>}
    </div>
  );
}

export default Minting;