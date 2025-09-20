const ODOG_ADDRESS = '0xc3f431cd1b7220cca703ee08c24ca645a71e72c8';
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dead';
const ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)'
];

let provider, signer, contract;
let canvas, ctx, grid = Array(10).fill().map(() => Array(8).fill(0)); // 10x8网格
let burning = false, totalCrops = 0;
const TILE_SIZE = 32;

function init() {
    canvas = document.getElementById('farmCanvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const connectBtn = document.getElementById('connect');
    const status = document.getElementById('status');
    const balanceEl = document.getElementById('balance');
    const cropsEl = document.getElementById('crops');

    connectBtn.onclick = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                // 兼容 OKX Web3 和 xLayer
                provider = new ethers.providers.Web3Provider(window.ethereum);
                await provider.send('eth_requestAccounts', []);
                signer = provider.getSigner();
                contract = new ethers.Contract(ODOG_ADDRESS, ABI, signer);
                const address = await signer.getAddress();
                status.textContent = `连接成功: ${address.slice(0,6)}...${address.slice(-4)}`;
                connectBtn.disabled = true;
                updateBalance();
                drawFarm();
            } catch (err) {
                status.textContent = '连接失败: ' + err.message;
            }
        } else {
            status.textContent = '安装钱包!';
        }
    };

    canvas.onclick = async (e) => {
        if (burning || !contract) return;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
        const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
        if (x >= 0 && x < 10 && y >= 0 && y < 8 && grid[y][x] === 0) {
            burning = true;
            try {
                status.textContent = '种植中（销毁ODOG）...';
                const decimals = await contract.decimals();
                const amount = ethers.utils.parseUnits('1', decimals);

                const tx = await contract.transfer(DEAD_ADDRESS, amount);
                await tx.wait();
                status.textContent = '种植成功! Tx: ' + tx.hash;

                grid[y][x] = 1;
                totalCrops += 1;
                cropsEl.textContent = totalCrops;
                updateBalance();
            } catch (err) {
                status.textContent = '失败: ' + err.message;
            }
            burning = false;
            drawFarm();
        }
    };

    async function updateBalance() {
        if (contract) {
            const balance = await contract.balanceOf(await signer.getAddress());
            const decimals = await contract.decimals();
            balanceEl.textContent = ethers.utils.formatUnits(balance, decimals);
        }
    }

    function drawFarm() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 10; x++) {
                ctx.fillStyle = '#228B22';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                if (grid[y][x] === 1) {
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(x * TILE_SIZE + 8, y * TILE_SIZE + 8, 16, 16);
                }
            }
        }
    }

    drawFarm();
}

init();
