import { ethers } from 'ethers'
import config from '@/config'
import { showToast, showLoadingToast, closeToast } from 'vant'
// abiMap["single"] = '[{"internalType": "address", "name": "contractAddress", "type": "address"},{"internalType": "uint256", "name": "amount", "type": "uint256"},{"internalType": "string", "name": "remark", "type": "string"}]';
// abiMap["double"] = '[{"internalType": "address", "name": "contractAddress", "type": "address"},{"internalType": "uint256", "name": "amount", "type": "uint256"},{"internalType": "address", "name": "contractAddress1", "type": "address"},{"internalType": "uint256", "name": "amount1", "type": "uint256"},{"internalType": "string", "name": "remark", "type": "string"}]';
let provider = null
let signer = null

const GAS_LIMITS = {
  nativeTransfer: 1000000,
  approve: 1000000,
  contractCall: 1000000
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const NATIVE_PAYMENT_NAMES = ['PYT', 'PYTHIA']

const isWalletInstalled = () => {
  if (typeof window === 'undefined') return false

  // 检查多种钱包提供者
  return !!(
    window.ethereum || // MetaMask, TokenPocket (某些版本)
    window.tokenpocket || // TokenPocket 专用
    window.web3?.currentProvider // 旧版钱包
  )
}

// 获取钱包提供者
const getProvider = () => {
  if (typeof window === 'undefined') return null

  // TokenPocket 优先
  if (window.tokenpocket?.isTokenPocket) {
    console.log('检测到 TokenPocket 钱包')
    return window.tokenpocket
  }

  // 标准 ethereum 提供者
  if (window.ethereum) {
    console.log('检测到标准 Ethereum 提供者')
    return window.ethereum
  }

  // 旧版 web3
  if (window.web3?.currentProvider) {
    console.log('检测到旧版 Web3 提供者')
    return window.web3.currentProvider
  }

  return null
}

export const ensureReady = async (isSwitchChain = false) => {
  if (!isWalletInstalled()) {
    showToast('请安装钱包（如 MetaMask）')
    throw new Error('Wallet not installed')
  }
  // if (window.ethereum.chainId !== config.network.chainId) {
  // 	showNotify({ type: 'warning', message: '请切换到主网络' })
  // 	if (!isSwitchChain){
  // 		setTimeout(() => {
  // 			switchChain()
  // 		}, 200)
  // 	}
  // 	throw new Error('Chain not supported')
  // }
  if (!provider) {
    const walletProvider = getProvider()
    provider = new ethers.BrowserProvider(walletProvider)
  }
  if (!signer) {
    signer = await provider.getSigner()
  }
  return { provider, signer }
}

// 原生转账（使用 MetaMask）
export const transfer = async (amount, address) => {
  await ensureReady()
  const amountWei = ethers.parseUnits(amount.toString(), 18)
  return await signer.sendTransaction({
    to: address,
    value: amountWei,
    gasLimit: GAS_LIMITS.contractCall
  })
}

// BNB转账（兑换专用）
export const transferBNB = async (amount, address) => {
  await ensureReady()
  const amountWei = ethers.parseUnits(amount.toString(), 18)

  try {
    showLoadingToast({
      message: '确认BNB转账中...',
      duration: 0
    })

    const tx = await signer.sendTransaction({
      to: address,
      value: amountWei,
      gasLimit: GAS_LIMITS.nativeTransfer
    })

    if (tx.hash) {
      showLoadingToast({
        message: 'BNB转账中...',
        duration: 0
      })
    }

    closeToast()
    showToast('BNB转账成功')
    return tx
  } catch (error) {
    closeToast()
    showToast('BNB转账失败')
    throw error
  }
}

//切换网络
export const switchChain = async () => {
  const walletProvider = getProvider()
  if (!walletProvider) {
    showToast('未检测到钱包')
    return
  }

  try {
    await walletProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: config.network.chainId }]
    })
  } catch (error) {
    if (error.code === 4902) {
      await walletProvider.request({
        method: 'wallet_addEthereumChain',
        params: config.network
      })
    }
  }
}

// 初始化主合约
const getMainContract = async () => {
  const { signer } = await ensureReady()
  return new ethers.Contract(config.main.address, config.main.abi, signer)
}
// 初始化自定义合约
const getCustomContract = async () => {
  const { signer } = await ensureReady()
  return new ethers.Contract(config.custom.address, config.custom.abi, signer)
}

// 调用签名
export const signMessage = async (message) => {
  await ensureReady()
  return await signer.signMessage(message)
}

// 主合约授权额度
export const getMainAllowance = async () => {
  await ensureReady()
  const mainContract = await getMainContract()
  return await mainContract.allowance(signer.address, config.custom.address)
}

// 查询主网代币余额
export const getMainBalance = async () => {
  await ensureReady()
  const address = signer.address
  const mainContract = await getMainContract()
  //业务层 需要使用ethers.formatUnits(balance, 18) 格式化 这里直接返回wei
  return await mainContract.balanceOf(address)
}

// 查询指定 ERC20 代币余额（通用方法）
export const getTokenBalance = async (contractAddress) => {
  await ensureReady()
  const address = signer.address

  // 验证合约地址格式
  if (!contractAddress || !ethers.isAddress(contractAddress)) {
    console.error('Invalid contract address:', contractAddress)
    return '0'
  }

  // ERC20 标准 ABI，只需要 balanceOf 方法
  const erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)'
  ]

  try {
    // 获取当前网络信息
    const network = await signer.provider.getNetwork()
    console.log('当前连接的网络:', {
      chainId: network.chainId,
      name: network.name
    })
    console.log('配置的目标网络链ID:', config.network.chainId)

    const tokenContract = new ethers.Contract(contractAddress, erc20Abi, signer)

    // 先检查合约是否存在（通过检查代码）
    const code = await signer.provider.getCode(contractAddress)
    if (code === '0x') {
      console.error('Contract does not exist at address:', contractAddress)
      console.error('当前网络链ID:', network.chainId)
      console.error('可能原因: 1. 网络不匹配 2. 合约地址错误 3. RPC节点问题')
      return '0'
    }

    // 调用 balanceOf 方法
    const balance = await tokenContract.balanceOf(address)
    return balance
  } catch (error) {
    console.error('获取代币余额失败:', error)
    console.error('合约地址:', contractAddress)
    console.error('用户地址:', address)

    // 返回0而不是抛出错误，避免阻断用户操作
    return '0'
  }
}

// 查询当前链原生币余额
export const getNativeBalance = async () => {
  await ensureReady()
  return await provider.getBalance(signer.address)
}

// 获取指定代币的授权额度
export const getTokenAllowance = async (tokenAddress, spenderAddress) => {
  await ensureReady()
  const erc20Abi = ['function allowance(address owner, address spender) view returns (uint256)']
  const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer)
  return await tokenContract.allowance(signer.address, spenderAddress)
}

// 授权指定代币
export const approveToken = async (tokenAddress, spenderAddress, amount = null) => {
  await ensureReady()
  const erc20Abi = ['function approve(address spender, uint256 amount) returns (bool)']
  const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer)

  // 如果指定了具体数量，就授权该数量；否则授权最大值
  const approveAmount = amount || ethers.MaxUint256

  try {
    // 手动设置 gas limit 避免 gas 估算失败
    const tx = await tokenContract.approve(spenderAddress, approveAmount, {
      gasLimit: GAS_LIMITS.approve
    })
    return tx
  } catch (error) {
    console.error('授权失败详情:', error)

    // 如果是 gas 估算失败，尝试用更高的 gas limit
    if (error.message.includes('gas') || error.code === 'UNKNOWN_ERROR') {
      console.log('尝试使用更高的 gas limit 重新授权...')
      try {
        const tx = await tokenContract.approve(spenderAddress, approveAmount, {
          gasLimit: GAS_LIMITS.approve
        })
        return tx
      } catch (retryError) {
        console.error('重试授权失败:', retryError)
        throw retryError
      }
    }
    throw error
  }
}

// 支付
export const pay = async (amount, remark) => {
  await ensureReady()
  const amountWei = ethers.parseUnits(amount.toString(), 18)
  //获取当前地址余额 暂时不验证余额 放到业务层
  const currentBalance = await getMainBalance(signer.address)
  if (currentBalance < amountWei) {
    showNotify('余额不足')
    return
  }
  const allowance = await getMainAllowance()
  if (allowance < amountWei) {
    showLoadingToast({
      message: '确认授权中...',
      duration: 0
    })
    let tx = await approve()
    if (tx.hash) {
      showLoadingToast({
        message: '确认授权中...',
        duration: 0
      })
    }
    await tx.wait()
    showLoadingToast({
      message: '授权成功...',
      duration: 0
    })
  }
  try {
    showLoadingToast({
      message: '确认支付中...',
      duration: 0
    })
    const abiKey = 'single'
    const to = config.main.address
    const abiCoder = ethers.AbiCoder.defaultAbiCoder()
    const data = abiCoder.encode(['address', 'uint256', 'string'], [to, amountWei, remark])
    const customContract = await getCustomContract()
    try {
      const tx = await customContract.recharge(abiKey, data, { gasLimit: GAS_LIMITS.contractCall })
      if (tx.hash) {
        showLoadingToast({
          message: '链上确认中...',
          duration: 0
        })
      }
      await tx.wait()
      closeToast()
      showToast('支付成功')
      Promise.resolve(tx)
    } catch (error) {
      showToast('支付失败')
    }
  } catch (error) {
    showToast('支付失败')
  }
}

// 主合约授权
export const approve = async () => {
  await ensureReady()
  const mainContract = await getMainContract()
  return await mainContract.approve(config.custom.address, ethers.MaxUint256)
}

// 挖矿支付通用方法
/**
 * @param {Object} params - 支付参数
 * @param {string} params.abiKey - ABI key (mining, miningActive, lp 或 merge)
 * @param {string} params.tokenAddress - 代币合约地址 (mining/miningActive/merge用，lp时是第一个代币地址)
 * @param {string} params.tokenAddress2 - 第二个代币合约地址 (仅lp需要)
 * @param {number} params.decimals - 代币精度
 * @param {string} params.amount - 支付数量
 * @param {string} params.remark - 订单号
 * @param {Object} params.addresses - 地址配置 (mining需要studioAddress/lecturerAddress/leaderAddress/zeroAddress, miningActive和merge不需要, lp需要amount1和amount2)
 */
export const miningPay = async ({
  abiKey,
  tokenAddress,
  tokenAddress2,
  decimals,
  amount,
  remark,
  addresses = {}
}) => {
  await ensureReady()
  const amountWei = ethers.parseUnits(amount.toString(), decimals || 18)

  // LP支付详细日志
  if (abiKey === 'lp') {
    console.log('==================== LP支付参数详情 ====================')
    console.log('1. 接收到的原始参数:')
    console.log('   - abiKey:', abiKey)
    console.log('   - tokenAddress (第一个代币-USDT):', tokenAddress)
    console.log('   - tokenAddress2 (第二个代币-LON):', tokenAddress2)
    console.log('   - decimals:', decimals)
    console.log('   - amount (主要金额):', amount)
    console.log('   - remark (订单号):', remark)
    console.log('2. addresses对象:')
    console.log('   - amount1 (LON数量,纯U时为0):', addresses.amount1?.toString())
    console.log('   - amount2 (USDT数量):', addresses.amount2?.toString())
    console.log('3. 格式化后的金额:')
    console.log(
      '   - amount1 (LON) 格式化:',
      addresses.amount1 ? ethers.formatUnits(addresses.amount1, 18) : '0'
    )
    console.log('   - amount2 (USDT) 格式化:', ethers.formatUnits(addresses.amount2, 18))
    console.log('====================================================')
  }

  // 获取挖矿合约配置
  const miningContract = config.mining
  if (!miningContract) {
    throw new Error('Mining contract not configured')
  }

  // 1. 检查代币余额
  showLoadingToast({
    message: '检查余额...',
    duration: 0
  })

  if (abiKey === 'lp') {
    // LP 需要检查两个代币的余额
    const { amount1, amount2 } = addresses

    console.log('==================== LP余额检查 ====================')
    console.log('检查第一个代币 (USDT):')
    console.log('   - 代币地址:', tokenAddress)
    console.log('   - 需要数量:', ethers.formatUnits(amount2, 18))

    // 检查第一个代币余额
    const balance1 = await getTokenBalance(tokenAddress)
    console.log('   - 链上余额:', ethers.formatUnits(balance1, 18))
    console.log('   - 余额是否充足:', balance1 >= amount2)

    if (balance1 < amount2) {
      closeToast()
      showToast('USDT链上余额不足')
      console.log('❌ USDT余额不足！')
      console.log('====================================================')
      throw new Error('Insufficient balance for USDT')
    }
    console.log('✅ USDT余额充足')

    // 检查第二个代币余额
    if (tokenAddress2 && amount1 > 0n) {
      console.log('检查第二个代币 (LON):')
      console.log('   - 代币地址:', tokenAddress2)
      console.log('   - 需要数量:', ethers.formatUnits(amount1, 18))

      const balance2 = await getTokenBalance(tokenAddress2)
      console.log('   - 链上余额:', ethers.formatUnits(balance2, 18))
      console.log('   - 余额是否充足:', balance2 >= amount1)

      if (balance2 < amount1) {
        closeToast()
        showToast('LON链上余额不足')
        console.log('❌ LON余额不足！')
        console.log('====================================================')
        throw new Error('Insufficient balance for LON')
      }
      console.log('✅ LON余额充足')
    } else {
      console.log('纯U模式，无需检查LON余额')
    }
    console.log('====================================================')
  } else {
    // mining、miningActive 和 merge 只需要检查一个代币余额
    const balance = await getTokenBalance(tokenAddress)
    if (balance < amountWei) {
      closeToast()
      showToast('链上余额不足')
      throw new Error('Insufficient balance')
    }
  }

  // 2. 检查授权
  if (abiKey === 'lp') {
    // LP 需要检查两个代币的授权
    const { amount1, amount2 } = addresses

    console.log('==================== LP授权检查 ====================')
    console.log('检查第一个代币 (USDT) 授权:')
    console.log('   - 代币地址:', tokenAddress)
    console.log('   - 合约地址:', miningContract.address)
    console.log('   - 需要授权:', ethers.formatUnits(amount2, 18))

    // 检查第一个代币授权
    const allowance1 = await getTokenAllowance(tokenAddress, miningContract.address)
    console.log('   - 当前授权:', ethers.formatUnits(allowance1, 18))
    console.log('   - 是否需要授权:', allowance1 < amount2)

    if (allowance1 < amount2) {
      showLoadingToast({
        message: '授权USDT...',
        duration: 0
      })
      console.log('开始USDT授权...')
      let approveTx = await approveToken(tokenAddress, miningContract.address)
      if (approveTx.hash) {
        console.log('USDT授权交易已发送:', approveTx.hash)
        showLoadingToast({
          message: '确认授权中...',
          duration: 0
        })
      }
      await approveTx.wait()
      console.log('✅ USDT授权成功')
    } else {
      console.log('✅ USDT授权充足，无需授权')
    }

    // 检查第二个代币授权
    if (tokenAddress2 && amount1 > 0n) {
      console.log('检查第二个代币 (LON) 授权:')
      console.log('   - 代币地址:', tokenAddress2)
      console.log('   - 合约地址:', miningContract.address)
      console.log('   - 需要授权:', ethers.formatUnits(amount1, 18))

      const allowance2 = await getTokenAllowance(tokenAddress2, miningContract.address)
      console.log('   - 当前授权:', ethers.formatUnits(allowance2, 18))
      console.log('   - 是否需要授权:', allowance2 < amount1)

      if (allowance2 < amount1) {
        showLoadingToast({
          message: '授权LON...',
          duration: 0
        })
        console.log('开始LON授权...')
        let approveTx2 = await approveToken(tokenAddress2, miningContract.address)
        if (approveTx2.hash) {
          console.log('LON授权交易已发送:', approveTx2.hash)
          showLoadingToast({
            message: '确认授权中...',
            duration: 0
          })
        }
        await approveTx2.wait()
        console.log('✅ LON授权成功')
      } else {
        console.log('✅ LON授权充足，无需授权')
      }
    } else {
      console.log('纯U模式，无需LON授权')
    }
    console.log('====================================================')

    showLoadingToast({
      message: '授权成功',
      duration: 0
    })
  } else {
    // mining、miningActive 和 merge 只需要检查一个代币授权
    const allowance = await getTokenAllowance(tokenAddress, miningContract.address)
    if (allowance < amountWei) {
      showLoadingToast({
        message: '授权中...',
        duration: 0
      })
      let approveTx = await approveToken(tokenAddress, miningContract.address)
      if (approveTx.hash) {
        showLoadingToast({
          message: '确认授权中...',
          duration: 0
        })
      }
      await approveTx.wait()
      showLoadingToast({
        message: '授权成功',
        duration: 0
      })
    }
  }

  try {
    showLoadingToast({
      message: '确认支付中...',
      duration: 0
    })

    // 根据不同的 abiKey 编码不同的数据
    const abiCoder = ethers.AbiCoder.defaultAbiCoder()
    let encodedData

    if (abiKey === 'mining') {
      // mining 需要: contractAddress, studioAddress, lecturerAddress, leaderAddress, zeroAddress, amount, remark
      const { studioAddress, lecturerAddress, leaderAddress, autonomyAddress } = addresses
      encodedData = abiCoder.encode(
        ['address', 'address', 'address', 'address', 'address', 'uint256', 'string'],
        [
          tokenAddress,
          studioAddress,
          lecturerAddress,
          leaderAddress,
          autonomyAddress,
          amountWei,
          remark
        ]
      )
    } else if (abiKey === 'miningActive') {
      // miningActive 只需要: contractAddress, amount, remark
      encodedData = abiCoder.encode(
        ['address', 'uint256', 'string'],
        [tokenAddress, amountWei, remark]
      )
    } else if (abiKey === 'merge') {
      // merge 只需要: amount, remark
      encodedData = abiCoder.encode(['uint256', 'string'], [amountWei, remark])
    } else if (abiKey === 'lp') {
      // lp 需要: amount1, amount2, remark
      const { amount1 = amountWei, amount2 = amountWei } = addresses

      console.log('==================== LP ABI编码 ====================')
      console.log('编码参数:')
      console.log('   - amount1 (LON):', amount1.toString(), '=', ethers.formatUnits(amount1, 18))
      console.log('   - amount2 (USDT):', amount2.toString(), '=', ethers.formatUnits(amount2, 18))
      console.log('   - remark (订单号):', remark)
      console.log('编码顺序: [amount1, amount2, remark]')

      encodedData = abiCoder.encode(['uint256', 'uint256', 'string'], [amount1, amount2, remark])

      console.log('编码后的数据 (前100字符):', encodedData.substring(0, 100) + '...')
      console.log('====================================================')
    } else if (abiKey === 'game_node') {
      // game_node 需要: studioAddress, amount, remark
      const { studioAddress } = addresses

      console.log('==================== game_node ABI编码 ====================')
      console.log('编码参数:')
      console.log('   - studioAddress:', studioAddress)
      console.log(
        '   - amount:',
        amountWei.toString(),
        '=',
        ethers.formatUnits(amountWei, decimals || 18)
      )
      console.log('   - remark (订单号):', remark)
      console.log('编码顺序: [studioAddress, amount, remark]')

      encodedData = abiCoder.encode(
        ['address', 'uint256', 'string'],
        [studioAddress, amountWei, remark]
      )

      console.log('编码后的数据 (前100字符):', encodedData.substring(0, 100) + '...')
      console.log('====================================================')
    } else if (abiKey === 'game_pledge') {
      // game_pledge 需要: amount, remark

      console.log('==================== game_pledge ABI编码 ====================')
      console.log('编码参数:')
      console.log(
        '   - amount:',
        amountWei.toString(),
        '=',
        ethers.formatUnits(amountWei, decimals || 18)
      )
      console.log('   - remark (订单号):', remark)
      console.log('编码顺序: [amount, remark]')

      encodedData = abiCoder.encode(['uint256', 'string'], [amountWei, remark])

      console.log('编码后的数据 (前100字符):', encodedData.substring(0, 100) + '...')
      console.log('====================================================')
    } else if (abiKey === 'recharge') {
      // recharge 需要: amount, remark

      console.log('==================== recharge ABI编码 ====================')
      console.log('编码参数:')
      console.log(
        '   - amount:',
        amountWei.toString(),
        '=',
        ethers.formatUnits(amountWei, decimals || 18)
      )
      console.log('   - remark (订单号):', remark)
      console.log('编码顺序: [amount, remark]')

      encodedData = abiCoder.encode(['uint256', 'string'], [amountWei, remark])

      console.log('编码后的数据 (前100字符):', encodedData.substring(0, 100) + '...')
      console.log('====================================================')
    } else {
      throw new Error(`Unknown abiKey: ${abiKey}`)
    }

    // 调用挖矿合约
    const contract = new ethers.Contract(miningContract.address, miningContract.abi, signer)

    console.log('==================== 调用合约 ====================')
    console.log('合约地址:', miningContract.address)
    console.log('调用方法: recharge')
    console.log('参数1 - abiKey:', abiKey)
    console.log('参数2 - encodedData (前100字符):', encodedData.substring(0, 100) + '...')
    console.log('====================================================')

    const tx = await contract.recharge(abiKey, encodedData, { gasLimit: GAS_LIMITS.contractCall })

    console.log('==================== 交易已发送 ====================')
    console.log('交易哈希:', tx.hash)
    console.log('====================================================')

    if (tx.hash) {
      showLoadingToast({
        message: '链上确认中...',
        duration: 0
      })
    }

    await tx.wait()

    console.log('==================== 交易已确认 ====================')
    console.log('交易成功！')
    console.log('====================================================')

    closeToast()
    showToast('支付成功')
    return tx
  } catch (error) {
    console.error('==================== 支付失败 ====================')
    console.error('错误类型:', error.code)
    console.error('错误信息:', error.message)
    console.error('完整错误:', error)
    console.error('====================================================')

    closeToast()
    showToast('支付失败')
    throw error
  }
}

// 监听地址变更
export const onAccountChange = (callback) => {
  if (!isWalletInstalled()) {
    showToast('请安装钱包（如 MetaMask、TokenPocket）')
    return
  }
  const walletProvider = getProvider()
  walletProvider.on('accountsChanged', (accounts) => {
    callback(accounts?.[0] || '')
  })
}

// 监听链变更
export const onChainChange = (callback) => {
  if (!isWalletInstalled()) {
    showToast('请安装钱包（如 MetaMask、TokenPocket）')
    return
  }
  const walletProvider = getProvider()
  walletProvider.on('chainChanged', (chainId) => {
    const numericChainId = parseInt(chainId)
    console.log(numericChainId)
    callback(numericChainId)
  })
}

// 单代币支付方法（服务端下发data）- 专门用于算力认购等单代币支付场景
export const payWithTokenOnly = async (orderData) => {
  await ensureReady()
  const {
    recharge_contract_address, // 充值合约地址
    data, // 服务端签名好的data
    need_pay // 需要支付的代币信息 { name, address, decimals, amount }
  } = orderData

  try {
    const tokenAddress = need_pay.address
    const tokenAmount = need_pay.amount
    const tokenDecimals = need_pay.decimals

    console.log('==================== 单代币支付流程 ====================')
    console.log('充值合约地址:', recharge_contract_address)
    console.log('代币地址:', tokenAddress)
    console.log('支付数量:', tokenAmount)
    console.log('代币精度:', tokenDecimals)
    console.log('====================================================')

    // 1. 检查代币余额
    showLoadingToast({
      message: '检查余额中...',
      duration: 0
    })

    const tokenBalance = await getTokenBalance(tokenAddress)
    const needTokenWei = ethers.parseUnits(tokenAmount.toString(), tokenDecimals)

    console.log('代币余额检查:')
    console.log('  需要:', ethers.formatUnits(needTokenWei, tokenDecimals))
    console.log('  拥有:', ethers.formatUnits(tokenBalance, tokenDecimals))

    if (tokenBalance < needTokenWei) {
      closeToast()
      showToast(`${need_pay.name}余额不足`)
      return Promise.reject(new Error(`${need_pay.name}余额不足`))
    }

    // 2. 检查授权额度
    showLoadingToast({
      message: '检查授权中...',
      duration: 0
    })

    const allowance = await getTokenAllowance(tokenAddress, recharge_contract_address)

    console.log('授权额度检查:')
    console.log('需要授权:', ethers.formatUnits(needTokenWei, tokenDecimals))
    console.log('当前授权:', ethers.formatUnits(allowance, tokenDecimals))
    console.log('是否需要授权:', allowance < needTokenWei)

    // 3. 如果授权额度不足，先进行授权
    if (allowance < needTokenWei) {
      showLoadingToast({
        message: '确认授权中...',
        duration: 0
      })

      console.log('开始授权...')
      const approveTx = await approveToken(tokenAddress, recharge_contract_address)

      if (approveTx.hash) {
        console.log('授权交易已发送:', approveTx.hash)
        showLoadingToast({
          message: '授权确认中...',
          duration: 0
        })
      }

      await approveTx.wait()
      console.log('✅ 授权成功')

      showLoadingToast({
        message: '授权成功',
        duration: 1000
      })
    } else {
      console.log('✅ 授权充足，无需授权')
    }

    // 4. 开始支付
    showLoadingToast({
      message: '确认支付中...',
      duration: 0
    })

    console.log('==================== 发起支付交易 ====================')
    console.log('交易参数:')
    console.log('  to:', recharge_contract_address)
    console.log('  data (前100字符):', data.substring(0, 100) + '...')
    console.log('  value: 0 (不需要主币)')
    console.log('====================================================')

    // 直接发送原始交易，data已经是服务端编码好的完整数据
    const tx = await signer.sendTransaction({
      to: recharge_contract_address, // 充值合约地址
      data: data, // 服务端下发的完整data（包含函数选择器和参数）
      value: 0, // 不需要主币，只支付代币
      gasLimit: GAS_LIMITS.contractCall
    })

    console.log('交易已发送:', tx.hash)

    if (tx.hash) {
      showLoadingToast({
        message: '链上确认中...',
        duration: 0
      })
    }

    await tx.wait()
    console.log('✅ 交易确认成功')

    closeToast()
    showToast('支付成功')

    return Promise.resolve(tx)
  } catch (error) {
    console.error('==================== 支付失败 ====================')
    console.error('错误类型:', error.code)
    console.error('错误信息:', error.message)
    console.error('完整错误:', error)
    console.error('====================================================')

    closeToast()
    // 如果不是余额不足的错误，才显示支付失败
    if (!error.message.includes('余额不足')) {
      showToast('支付失败')
    }
    return Promise.reject(error)
  }
}

const normalizeNativeValue = (value, fallbackAmount, decimals = 18) => {
  if (typeof value === 'bigint') return value

  if (typeof value === 'string' && value.trim()) {
    const normalizedValue = value.trim()

    if (normalizedValue.startsWith('0x')) {
      return BigInt(normalizedValue)
    }

    if (normalizedValue.includes('.')) {
      return ethers.parseUnits(normalizedValue, decimals)
    }

    return BigInt(normalizedValue)
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return ethers.parseUnits(value.toString(), decimals)
  }

  return ethers.parseUnits((fallbackAmount || '0').toString(), decimals)
}

const isNativePaymentToken = (token) => {
  if (!token) return false

  const normalizedName = (token.name || token.symbol || '').toUpperCase()
  const normalizedAddress = (token.address || token.contract_address || '').toLowerCase()

  return token.is_native === true ||
    token.is_native === 1 ||
    normalizedAddress === ZERO_ADDRESS.toLowerCase() ||
    NATIVE_PAYMENT_NAMES.includes(normalizedName)
}

// 原生币支付（服务端下发 data，交易通过 value 支付主币）
export const payWithNativeCoinOnly = async (orderData) => {
  await ensureReady()
  const { recharge_contract_address, data, need_pay, value } = orderData

  try {
    const nativeSymbol = need_pay?.name || config.network.nativeCurrency.symbol
    const nativeDecimals = need_pay?.decimals ?? config.network.nativeCurrency.decimals ?? 18
    const payValue = normalizeNativeValue(value, need_pay?.amount, nativeDecimals)

    console.log('==================== 原生币支付流程 ====================')
    console.log('充值合约地址:', recharge_contract_address)
    console.log('支付币种:', nativeSymbol)
    console.log('支付数量(wei):', payValue.toString())
    console.log('====================================================')

    showLoadingToast({
      message: '检查余额中...',
      duration: 0
    })

    const nativeBalance = await getNativeBalance()

    console.log('原生币余额检查:')
    console.log('  需要:', ethers.formatUnits(payValue, nativeDecimals))
    console.log('  拥有:', ethers.formatUnits(nativeBalance, nativeDecimals))

    if (nativeBalance < payValue) {
      closeToast()
      showToast(`${nativeSymbol}余额不足`)
      return Promise.reject(new Error(`${nativeSymbol}余额不足`))
    }

    showLoadingToast({
      message: '确认支付中...',
      duration: 0
    })

    console.log('==================== 发起原生币支付交易 ====================')
    console.log('交易参数:')
    console.log('  to:', recharge_contract_address)
    console.log('  data (前100字符):', data.substring(0, 100) + '...')
    console.log('  value:', payValue.toString())
    console.log('====================================================')

    const tx = await signer.sendTransaction({
      to: recharge_contract_address,
      data,
      value: payValue,
      gasLimit: GAS_LIMITS.contractCall
    })

    console.log('交易已发送:', tx.hash)

    if (tx.hash) {
      showLoadingToast({
        message: '链上确认中...',
        duration: 0
      })
    }

    await tx.wait()
    console.log('✅ 交易确认成功')

    closeToast()
    showToast('支付成功')

    return Promise.resolve(tx)
  } catch (error) {
    console.error('==================== 原生币支付失败 ====================')
    console.error('错误类型:', error.code)
    console.error('错误信息:', error.message)
    console.error('完整错误:', error)
    console.error('====================================================')

    closeToast()
    if (!error.message.includes('余额不足')) {
      showToast('支付失败')
    }
    return Promise.reject(error)
  }
}

// 新的支付方法（服务端下发data）
export const payWithSignData = async (orderData) => {
  await ensureReady()
  const {
    contractAddress, // 充值合约地址
    contractAddress2, // 代币合约地址
    data, // 服务端签名好的data
    needNum, // 需要支付代币1的数量
    needOtherNum, // 需要支付主币的数量
    recharge_type, // "0"-单币 "1"-双币
    value // 需要支付的主币数量（value参数，已经是wei单位）
  } = orderData

  try {
    // 检查主币JU余额
    const juBalance = await provider.getBalance(signer.address)
    const needJuWei = ethers.parseUnits(needNum.toString(), 18)

    if (juBalance < needJuWei) {
      showToast('JU余额不足')
      return Promise.reject(new Error('JU余额不足'))
    }

    // 双币情况需要先检查代币余额和授权
    if (recharge_type === '1') {
      showLoadingToast({
        message: '检查余额中...',
        duration: 0
      })

      // 获取代币合约
      const tokenContract = new ethers.Contract(contractAddress2, config.main.abi, signer)

      // 检查代币余额
      const needOtherWei = ethers.parseUnits(needOtherNum.toString(), 18)
      const tokenBalance = await tokenContract.balanceOf(signer.address)

      if (tokenBalance < needOtherWei) {
        closeToast()
        showToast('代币余额不足')
        return Promise.reject(new Error('代币余额不足'))
      }

      // 检查授权额度
      showLoadingToast({
        message: '检查授权中...',
        duration: 0
      })

      const allowance = await tokenContract.allowance(signer.address, contractAddress)

      // 如果授权额度不足，先进行授权
      if (allowance < needOtherWei) {
        showLoadingToast({
          message: '确认授权中...',
          duration: 0
        })

        const approveTx = await tokenContract.approve(contractAddress, ethers.MaxUint256)

        if (approveTx.hash) {
          showLoadingToast({
            message: '授权确认中...',
            duration: 0
          })
        }

        await approveTx.wait()

        showLoadingToast({
          message: '授权成功',
          duration: 1000
        })
      }
    }

    // 开始支付
    showLoadingToast({
      message: '确认支付中...',
      duration: 0
    })

    // 直接发送原始交易，data已经是服务端编码好的完整数据
    const tx = await signer.sendTransaction({
      to: contractAddress, // 充值合约地址
      data: data, // 服务端下发的完整data（包含函数选择器和参数）
      value: value, // 需要支付的主币数量（已经是wei单位）
      gasLimit: GAS_LIMITS.contractCall
    })

    if (tx.hash) {
      showLoadingToast({
        message: '链上确认中...',
        duration: 0
      })
    }

    await tx.wait()
    closeToast()

    return Promise.resolve(tx)
  } catch (error) {
    console.error('支付失败:', error)
    closeToast()
    // 如果不是余额不足的错误，才显示支付失败
    if (!error.message.includes('余额不足')) {
      showToast('支付失败')
    }
    return Promise.reject(error)
  }
}

// Uniswap V2 Router ABI (只需要 getAmountsOut 方法)
const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)'
]

/**
 * 获取路由兑换的输出金额
 * @param {string} routerAddress - 路由合约地址
 * @param {string} amountIn - 输入金额(wei格式)
 * @param {string[]} path - 代币路径 [tokenA地址, tokenB地址]
 * @param {number} decimalsIn - 输入代币精度
 * @param {number} decimalsOut - 输出代币精度
 * @returns {Promise<string>} 输出金额(格式化后的字符串)
 */
export const getAmountsOut = async (
  routerAddress,
  amountIn,
  path,
  decimalsIn = 18,
  decimalsOut = 18
) => {
  try {
    await ensureReady()

    console.log('=========== 获取路由兑换金额 ===========')
    console.log('路由地址:', routerAddress)
    console.log('输入金额:', amountIn)
    console.log('代币路径:', path)
    console.log('输入精度:', decimalsIn)
    console.log('输出精度:', decimalsOut)

    // 创建路由合约实例
    const routerContract = new ethers.Contract(routerAddress, ROUTER_ABI, provider)

    // 将输入金额转换为wei
    const amountInWei = ethers.parseUnits(amountIn.toString(), decimalsIn)
    console.log('输入金额(wei):', amountInWei.toString())

    // 调用 getAmountsOut
    const amounts = await routerContract.getAmountsOut(amountInWei, path)
    console.log(
      '返回的amounts数组:',
      amounts.map((a) => a.toString())
    )

    // amounts[0] 是输入金额, amounts[1] 是输出金额
    const amountOut = amounts[amounts.length - 1]
    console.log('输出金额(wei):', amountOut.toString())

    // 格式化输出金额
    const formattedAmountOut = ethers.formatUnits(amountOut, decimalsOut)
    console.log('输出金额(格式化):', formattedAmountOut)
    console.log('=====================================')

    return formattedAmountOut
  } catch (error) {
    console.error('获取路由兑换金额失败:', error)
    throw error
  }
}

// 双币支付方法 (用于LP挖矿)
export const payWithDualToken = async (orderInfo) => {
  await ensureReady()

  const { contractAddress, data, token1, token2 } = orderInfo

  try {
    console.log('==================== 开始双币支付 ====================')
    // 1. 检查 Token1 (X101) 余额
    showLoadingToast({
      message: `检查${token1.name}余额...`,
      duration: 0
    })

    const token1Contract = new ethers.Contract(token1.address, config.main.abi, signer)
    const token1AmountWei = ethers.parseUnits(token1.amount.toString(), token1.decimals)
    const token1Balance = await token1Contract.balanceOf(signer.address)

    if (token1Balance < token1AmountWei) {
      closeToast()
      showToast(`${token1.name}余额不足`)
      return Promise.reject(new Error(`${token1.name}余额不足`))
    }

    // 2. 检查 Token2 (ADX) 余额
    showLoadingToast({
      message: `检查${token2.name}余额...`,
      duration: 0
    })

    const token2Contract = new ethers.Contract(token2.address, config.main.abi, signer)
    const token2AmountWei = ethers.parseUnits(token2.amount.toString(), token2.decimals)
    const token2Balance = await token2Contract.balanceOf(signer.address)

    if (token2Balance < token2AmountWei) {
      closeToast()
      showToast(`${token2.name}余额不足`)
      return Promise.reject(new Error(`${token2.name}余额不足`))
    }

    // 3. 检查 Token1 授权
    showLoadingToast({
      message: `检查${token1.name}授权...`,
      duration: 0
    })

    const token1Allowance = await token1Contract.allowance(signer.address, contractAddress)

    if (token1Allowance < token1AmountWei) {
      showLoadingToast({
        message: `授权${token1.name}中...`,
        duration: 0
      })

      const approveTx1 = await token1Contract.approve(contractAddress, ethers.MaxUint256)

      if (approveTx1.hash) {
        showLoadingToast({
          message: `${token1.name}授权确认中...`,
          duration: 0
        })
      }

      await approveTx1.wait()
    }

    // 4. 检查 Token2 授权
    showLoadingToast({
      message: `检查${token2.name}授权...`,
      duration: 0
    })

    const token2Allowance = await token2Contract.allowance(signer.address, contractAddress)

    if (token2Allowance < token2AmountWei) {
      showLoadingToast({
        message: `授权${token2.name}中...`,
        duration: 0
      })

      const approveTx2 = await token2Contract.approve(contractAddress, ethers.MaxUint256)

      if (approveTx2.hash) {
        showLoadingToast({
          message: `${token2.name}授权确认中...`,
          duration: 0
        })
      }

      await approveTx2.wait()
    }

    // 5. 发起支付交易
    showLoadingToast({
      message: '发起支付中...',
      duration: 0
    })

    const tx = await signer.sendTransaction({
      to: contractAddress,
      data: data,
      gasLimit: GAS_LIMITS.contractCall
    })

    if (tx.hash) {
      showLoadingToast({
        message: '链上确认中...',
        duration: 0
      })
    }

    await tx.wait()
    console.log('✅ 交易确认成功')

    closeToast()
    showToast('支付成功')

    console.log('==================== 双币支付完成 ====================')

    return Promise.resolve(tx)
  } catch (error) {
    console.error('==================== 双币支付失败 ====================')
    console.error('错误类型:', error.code)
    console.error('错误信息:', error.message)
    console.error('完整错误:', error)
    console.error('====================================================')

    closeToast()
    if (!error.message.includes('余额不足')) {
      showToast('支付失败')
    }
    return Promise.reject(error)
  }
}

// LP 双币支付（兼容 1 个原生币 + 1 个 ERC20）
export const payWithLpDualAsset = async (orderInfo) => {
  await ensureReady()

  const { contractAddress, data, token1, token2, value } = orderInfo
  const tokens = [token1, token2].filter(Boolean)
  const nativeToken = tokens.find((token) => isNativePaymentToken(token))
  const erc20Token = tokens.find((token) => token && !isNativePaymentToken(token))

  // 如果不是原生币 + ERC20 组合，则回退到原有双 ERC20 流程，避免影响其他情况
  if (!nativeToken || !erc20Token) {
    return payWithDualToken(orderInfo)
  }

  try {
    console.log('==================== 开始 LP 原生币 + 代币支付 ====================')

    const nativeDecimals = nativeToken.decimals ?? config.network.nativeCurrency.decimals ?? 18
    const nativeAmountWei = normalizeNativeValue(value, nativeToken.amount, nativeDecimals)

    showLoadingToast({
      message: `检查${nativeToken.name}余额...`,
      duration: 0
    })

    const nativeBalance = await getNativeBalance()
    if (nativeBalance < nativeAmountWei) {
      closeToast()
      showToast(`${nativeToken.name}余额不足`)
      return Promise.reject(new Error(`${nativeToken.name}余额不足`))
    }

    showLoadingToast({
      message: `检查${erc20Token.name}余额...`,
      duration: 0
    })

    const erc20Contract = new ethers.Contract(erc20Token.address, config.main.abi, signer)
    const erc20AmountWei = ethers.parseUnits(erc20Token.amount.toString(), erc20Token.decimals)
    const erc20Balance = await erc20Contract.balanceOf(signer.address)

    if (erc20Balance < erc20AmountWei) {
      closeToast()
      showToast(`${erc20Token.name}余额不足`)
      return Promise.reject(new Error(`${erc20Token.name}余额不足`))
    }

    showLoadingToast({
      message: `检查${erc20Token.name}授权...`,
      duration: 0
    })

    const erc20Allowance = await erc20Contract.allowance(signer.address, contractAddress)

    if (erc20Allowance < erc20AmountWei) {
      showLoadingToast({
        message: `授权${erc20Token.name}中...`,
        duration: 0
      })

      const approveTx = await erc20Contract.approve(contractAddress, ethers.MaxUint256)

      if (approveTx.hash) {
        showLoadingToast({
          message: `${erc20Token.name}授权确认中...`,
          duration: 0
        })
      }

      await approveTx.wait()
    }

    showLoadingToast({
      message: '发起支付中...',
      duration: 0
    })

    const tx = await signer.sendTransaction({
      to: contractAddress,
      data,
      value: nativeAmountWei,
      gasLimit: GAS_LIMITS.contractCall
    })

    if (tx.hash) {
      showLoadingToast({
        message: '链上确认中...',
        duration: 0
      })
    }

    await tx.wait()

    closeToast()
    showToast('支付成功')

    console.log('==================== LP 原生币 + 代币支付完成 ====================')

    return Promise.resolve(tx)
  } catch (error) {
    console.error('==================== LP 原生币 + 代币支付失败 ====================')
    console.error('错误类型:', error.code)
    console.error('错误信息:', error.message)
    console.error('完整错误:', error)
    console.error('====================================================')

    closeToast()
    if (!error.message.includes('余额不足')) {
      showToast('支付失败')
    }
    return Promise.reject(error)
  }
}

export default {
  get provider() {
    return provider
  },
  get signer() {
    return signer
  },
  onAccountChange,
  onChainChange,
  signMessage,
  getMainAllowance,
  pay,
  approve,
  getMainBalance,
  getNativeBalance,
  getTokenBalance,
  getTokenAllowance,
  approveToken,
  miningPay,
  transferBNB,
  ensureReady,
  payWithSignData,
  payWithNativeCoinOnly,
  payWithTokenOnly,
  payWithDualToken,
  payWithLpDualAsset,
  getAmountsOut
}
