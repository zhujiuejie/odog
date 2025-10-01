import React, { useState, useMemo } from 'react';
import { useAccount, useConnect, useWriteContract, useSimulateContract, useBalance, useContractRead, useWaitForTransaction } from 'wagmi';
import { parseEther, formatEther } from 'viem';
// 已适配 wagmi v2.x，不再需要 InjectedConnector
import { CHAIN_ID, NFT_CONTRACT_ADDRESS, ODOG_TOKEN_ADDRESS, ODOG_ABI, NFT_ABI, MINT_AMOUNT } from '../constants';

function Minting() {
  const { address, isConnected, chain } = useAccount();
  // 直接使用 useConnect 默认连接器
  const { connect, connectors } = useConnect();
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
    try {
      // allowance 可能为 BigInt 或字符串
      return BigInt(allowance.toString()) >= BigInt(MINT_AMOUNT.toString());
    } catch {
      return false;
    }
  }, [allowance]);

  // --- 3. 授权 (Approve) 逻辑 ---
  const approveSim = useSimulateContract({
    address: ODOG_TOKEN_ADDRESS,
    abi: ODOG_ABI,
    functionName: 'approve',
    args: [NFT_CONTRACT_ADDRESS, MINT_AMOUNT],
    query: { enabled: !isApproved && isConnected },
    chainId: CHAIN_ID,
  });
  const approveWrite = useWriteContract();
  const isApproving = approveWrite.isPending;
  // --- 4. 铸造 (Mint/writeMessage) 逻辑 ---
  const mintSim = useSimulateContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: 'writeMessage',
    args: [message],
    query: { enabled: isApproved && isConnected && message.length > 0 },
    chainId: CHAIN_ID,
  });
  const mintWrite = useWriteContract();
  const isMinting = mintWrite.isPending;
  const isMintSuccess = mintWrite.isSuccess;

  // 辅助函数
  const handleMint = () => {
    if (!mintSim.data) return;
    mintWrite.writeAsync(mintSim.data.request);
  };

  const handleApprove = () => {
    if (!approveSim.data) return;
    approveWrite.writeAsync(approveSim.data.request);
  };
  
  // UI 渲染逻辑
  if (!isConnected || chain?.id !== CHAIN_ID) {
    return (
      <div className="card">
        <h3>NFT 铸造墙 (X Layer)</h3>
        <p>请连接钱包，并确保网络为 <b>X Layer (Chain ID: 196)</b>。</p>
        {/* 列出所有可用连接器 */}
        {connectors.map((connector) => (
          <button key={connector.id} onClick={() => connect({ connector })}>
            连接 {connector.name}
          </button>
        ))}
      </div>
    );
  }
  
  const odogBalance = balanceData ? formatEther(balanceData.value) : '...';
  const hasEnoughBalance = balanceData && BigInt(balanceData.value.toString()) >= BigInt(MINT_AMOUNT.toString());
  
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
          disabled={!approveSim.data || isApproving || !hasEnoughBalance}
        >
          {isApproving ? '授权中...' : `授权 NFT 合约花费 ${formatEther(MINT_AMOUNT)} ODOG`}
        </button>
      ) : (
        // 铸造按钮
        <button
          onClick={handleMint}
          disabled={!mintSim.data || isMinting || message.length === 0 || !hasEnoughBalance}
        >
          {isMinting ? '铸造中...' : isMintSuccess ? '铸造成功！' : `铸造 NFT (销毁 100 ODOG)`}
        </button>
      )}
      
      {/* 状态反馈 */}
  {!hasEnoughBalance && <p style={{ color: 'red' }}>代币余额不足 100 ODOG。</p>}
  {isMintSuccess && <p style={{ color: 'green' }}>NFT 铸造成功！</p>}
  {isApproving && <p style={{ color: 'orange' }}>请在钱包中确认授权交易...</p>}
    </div>
  );
}

export default Minting;