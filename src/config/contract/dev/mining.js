export const address = '0xD6dCD4ef7180A147EdA4703AAc8e28D191d9A89C'
export const abi = [
  {
    inputs: [
      {
        internalType: 'string',
        name: 'abiKey',
        type: 'string'
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes'
      }
    ],
    name: 'recharge',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  }
]

// ABI 编码映射
export const abiMap = {
  mining:
    '[{"internalType": "address", "name": "contractAddress", "type": "address"},{"internalType": "address", "name": "studioAddress", "type": "address"},{"internalType": "address", "name": "lecturerAddress", "type": "address"},{"internalType": "address", "name": "leaderAddress", "type": "address"},{"internalType": "address", "name": "autonomyAddress", "type": "address"},{"internalType": "uint256", "name": "amount", "type": "uint256"},{"internalType": "string", "name": "remark", "type": "string"}]',
  miningActive: 
    '[{"internalType": "address", "name": "contractAddress", "type": "address"},{"internalType": "uint256", "name": "amount", "type": "uint256"},{"internalType": "string", "name": "remark", "type": "string"}]',
  lp: '[{"internalType": "uint256", "name": "amount1", "type": "uint256"},{"internalType": "uint256", "name": "amount2", "type": "uint256"},{"internalType": "string", "name": "remark", "type": "string"}]',
  merge: '[{"internalType": "uint256", "name": "amount1", "type": "uint256"},{"internalType": "string", "name": "remark", "type": "string"}]',
  game_node: '[{"internalType": "address", "name": "studioAddress", "type": "address"},{"internalType": "uint256", "name": "amount", "type": "uint256"},{"internalType": "string", "name": "remark", "type": "string"}]',
  game_pledge: '[{"internalType": "uint256", "name": "amount", "type": "uint256"},{"internalType": "string", "name": "remark", "type": "string"}]',
  recharge: '[{"internalType": "uint256", "name": "amount", "type": "uint256"},{"internalType": "string", "name": "remark", "type": "string"}]'
}
