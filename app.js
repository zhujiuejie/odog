// 合约地址和ABI，这些是从区块链浏览器获取的
const contractAddress = "0x39c9B67241459DF881A0C501C0bd769973A3EaB7";
const contractABI = [
  "function mint(string calldata _id) external",
  "function batchMint(uint256 amount) external",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)"
];

// 获取页面元素
const connectWalletBtn = document.getElementById("connectWalletBtn");
const mintBtn = document.getElementById("mintBtn");
const idInput = document.getElementById("idInput");
const statusDiv = document.getElementById("status");

let provider;
let signer;
let contract;

// 初始化函数，在页面加载时运行
document.addEventListener("DOMContentLoaded", () => {
    updateStatus("请连接您的钱包。");
});

function updateStatus(message) {
    statusDiv.textContent = message;
}

// 连接钱包函数
async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    updateStatus("请安装 MetaMask 或其他支持的钱包！");
    return;
  }

  try {
    // 请求连接钱包
    await window.ethereum.request({ method: "eth_requestAccounts" });
    
    // 检查并切换到 X Layer 网络
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const xlayerChainId = '0xc4'; // 196 的十六进制

    if (chainId !== xlayerChainId) {
      updateStatus("正在切换网络到 X Layer...");
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: xlayerChainId }],
        });
      } catch (switchError) {
        // 如果用户拒绝切换，或者钱包中没有 X Layer
        if (switchError.code === 4902) {
          try {
            updateStatus("您的钱包中没有 X Layer 网络，正在尝试添加...");
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: xlayerChainId,
                chainName: 'X Layer',
                rpcUrls: ['https://rpc.xlayer.tech'],
                nativeCurrency: {
                  name: 'OKB',
                  symbol: 'OKB',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://www.okx.com/zh-hans/explorer/x-layer'],
              }],
            });
            // 添加成功后，钱包会自动切换
            updateStatus("X Layer 网络已成功添加，请重新连接钱包。");
            return;
          } catch (addError) {
            updateStatus(`添加 X Layer 网络失败: ${addError.message}`);
            return;
          }
        }
        updateStatus(`网络切换失败: ${switchError.message}`);
        return;
      }
    }

    // 创建一个 provider 和 signer
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();

    // 创建合约实例
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    // 显示铸造部分，隐藏连接按钮
    connectWalletBtn.style.display = "none";
    updateStatus("钱包已连接到 X Layer！");

    // 监听账户变化，方便调试
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        updateStatus("钱包已断开连接。");
        connectWalletBtn.style.display = "block";
      } else {
        updateStatus("账户已切换，请刷新页面。");
      }
    });

  } catch (error) {
    updateStatus(`连接钱包失败: ${error.message}`);
    console.error("连接钱包失败:", error);
  }
}

// 铸造函数
async function mintNFT() {
    if (!signer) {
        updateStatus("请先连接钱包。");
        return;
    }

    try {
        const id = idInput.value.trim();
        updateStatus("正在发送交易，请在钱包中确认...");
        
        let tx;
        if (id) {
            tx = await contract.mint(id);
        } else {
            tx = await contract.batchMint(1);
        }

        const receipt = await tx.wait();
        updateStatus(`铸造成功！交易哈希: <a href="https://www.okx.com/zh-hans/explorer/x-layer/tx/${receipt.transactionHash}" target="_blank">${receipt.transactionHash}</a>`);
        console.log("交易成功:", receipt);

    } catch (error) {
        if (error.code === 4001) {
            updateStatus("交易已被用户拒绝。");
        } else {
            updateStatus(`铸造失败: ${error.message}`);
        }
        console.error("铸造失败:", error);
    }
}

// 绑定按钮点击事件
connectWalletBtn.addEventListener("click", connectWallet);
mintBtn.addEventListener("click", mintNFT);
