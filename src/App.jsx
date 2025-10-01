import React from 'react';
import Minting from './components/Minting';

function App() {
  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <h1>ODOG 消息墙 NFT 铸造</h1>
      <Minting />
      <footer>
        <p>链：X Layer (196)</p>
      </footer>
    </div>
  );
}

export default App;