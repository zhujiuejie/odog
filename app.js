const contractAddress = "0x39c9B67241459DF881A0C501C0bd769973A3EaB7";
const contractABI = [
  "function mint(string calldata _id) external",
  "function batchMint(uint256 amount) external",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)"
];

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

async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
        updateStatus("请安装 MetaMask 或其他支持的钱包！");
        return;
    }

    try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        contract = new ethers.Contract(contractAddress, contractABI, signer);
        
        connectWalletBtn.style.display = "none";
        updateStatus("钱包已连接！");
        
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
        updateStatus(`铸造成功！交易哈希: ${receipt.transactionHash}`);
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

connectWalletBtn.addEventListener("click", connectWallet);
mintBtn.addEventListener("click", mintNFT);
