import * as Types from './types'
import { getAddresses, getProviderGasPrice } from '../../utils/web3'
import { getRouterContract } from '../../utils/web3Contracts'
import { payloadToDispatch, errorToDispatch } from '../helpers'

export const routerLoading = () => ({
  type: Types.ROUTER_LOADING,
})

// --------------------------------------- LIQUIDITY FUNCTIONS ---------------------------------------

/**
 * Add Liquidity to a pool symmetrically
 * @param {uint} inputBase
 * @param {address} inputToken
 * @param {address} token
 * @param {object} wallet
 * @returns {unit} units
 * @returns {unit} fee
 */
export const addLiquidity = (inputBase, inputToken, token, wallet) => async (
  dispatch,
) => {
  dispatch(routerLoading())
  const contract = getRouterContract(wallet)
  try {
    const gPrice = await getProviderGasPrice()
    const ORs = {
      value:
        token === '0x0000000000000000000000000000000000000000'
          ? inputToken
          : null,
      gasPrice: gPrice,
    }
    const addLiq = await contract.addLiquidity(
      inputBase,
      inputToken,
      token,
      ORs,
    )
    dispatch(payloadToDispatch(Types.ROUTER_ADD_LIQ, addLiq))
  } catch (error) {
    dispatch(errorToDispatch(Types.ROUTER_ERROR, `${error}.`))
  }
}

/**
 * Swap LP tokens for other LP tokens
 * @param {uint} unitsInput
 * @param {address} fromPool
 * @param {address} toPool
 * @param {object} wallet
 * @returns {unit} units
 */
export const zapLiquidity = (unitsInput, fromPool, toPool, wallet) => async (
  dispatch,
) => {
  dispatch(routerLoading())
  const contract = getRouterContract(wallet)
  try {
    const gPrice = await getProviderGasPrice()
    const zapLiq = await contract.zapLiquidity(unitsInput, fromPool, toPool, {
      gasPrice: gPrice,
    })
    dispatch(payloadToDispatch(Types.ROUTER_ZAP_LIQ, zapLiq))
  } catch (error) {
    dispatch(errorToDispatch(Types.ROUTER_ERROR, `${error}.`))
  }
}

/**
 * Add liquidity asymmetrically
 * @param {uint} input
 * @param {bool} fromBase
 * @param {address} token
 * @param {object} wallet
 * @returns {unit} units
 */
export const addLiquiditySingle = (input, fromBase, token, wallet) => async (
  dispatch,
) => {
  dispatch(routerLoading())
  const addr = getAddresses()
  const contract = getRouterContract(wallet)
  try {
    const gPrice = await getProviderGasPrice()
    const ORs = {
      value: token === addr.bnb && fromBase !== true ? input : null,
      gasPrice: gPrice,
    }
    const addLiqSingle = await contract.addLiquiditySingle(
      input,
      fromBase,
      token,
      ORs,
    )
    dispatch(payloadToDispatch(Types.ROUTER_ADD_LIQ_SINGLE, addLiqSingle))
  } catch (error) {
    dispatch(errorToDispatch(Types.ROUTER_ERROR, `${error}.`))
  }
}

/**
 * Remove liquidity symmetrically
 * @param {uint} units
 * @param {address} token
 * @param {object} wallet
 * @returns {unit} units
 */
export const removeLiquidityExact = (units, token, wallet) => async (
  dispatch,
) => {
  dispatch(routerLoading())
  const contract = getRouterContract(wallet)
  try {
    const gPrice = await getProviderGasPrice()
    const remLiq = await contract.removeLiquidityExact(units, token, {
      gasPrice: gPrice,
    })

    dispatch(payloadToDispatch(Types.ROUTER_REMOVE_LIQ, remLiq))
  } catch (error) {
    dispatch(errorToDispatch(Types.ROUTER_ERROR, `${error}.`))
  }
}

/**
 * Remove liquidity asymmetrically
 * @param {uint} units
 * @param {bool} toBase
 * @param {address} token
 * @param {object} wallet
 * @returns {unit} fee
 */
export const removeLiquiditySingle = (units, toBase, token, wallet) => async (
  dispatch,
) => {
  dispatch(routerLoading())
  const contract = getRouterContract(wallet)
  try {
    const gPrice = await getProviderGasPrice()
    const remLiqSingle = await contract.removeLiquiditySingle(
      units,
      toBase,
      token,
      {
        gasPrice: gPrice,
      },
    )

    dispatch(payloadToDispatch(Types.ROUTER_REMOVE_LIQ_SINGLE, remLiqSingle))
  } catch (error) {
    dispatch(errorToDispatch(Types.ROUTER_ERROR, `${error}.`))
  }
}

// --------------------------------------- SWAP FUNCTIONS ---------------------------------------

/**
 * Swap BEP20 assets
 * @param {uint} inputAmount
 * @param {address} fromToken
 * @param {address} toToken
 * @param {object} wallet
 */
export const swap = (inputAmount, fromToken, toToken, wallet) => async (
  dispatch,
) => {
  dispatch(routerLoading())
  const addr = getAddresses()
  const contract = getRouterContract(wallet)
  try {
    const gPrice = await getProviderGasPrice()
    const ORs = {
      value: fromToken === addr.bnb ? inputAmount : null,
      gasPrice: gPrice,
    }
    const swapped = await contract.swap(inputAmount, fromToken, toToken, ORs)
    dispatch(payloadToDispatch(Types.ROUTER_SWAP, swapped))
  } catch (error) {
    dispatch(errorToDispatch(Types.ROUTER_ERROR, `${error}.`))
  }
}

/**
 * Swap BEP20 for synthetic assets
 * @param {uint} inputAmount
 * @param {address} fromToken
 * @param {address} toSynth
 * @param {object} wallet
 * @returns {unit} outputSynth
 */
export const swapAssetToSynth = (
  inputAmount,
  fromToken,
  toSynth,
  wallet,
) => async (dispatch) => {
  dispatch(routerLoading())
  const addr = getAddresses()
  const contract = getRouterContract(wallet)
  try {
    const gPrice = await getProviderGasPrice()
    const ORs = {
      value: fromToken === addr.bnb ? inputAmount : null,
      gasPrice: gPrice,
    }
    const mintSynth = await contract.swapAssetToSynth(
      inputAmount,
      fromToken,
      toSynth,
      ORs,
    )
    dispatch(payloadToDispatch(Types.ROUTER_MINT_SYNTH, mintSynth))
  } catch (error) {
    dispatch(errorToDispatch(Types.ROUTER_ERROR, `${error}.`))
  }
}

/**
 * Swap synthetic assets for SPARTA
 * @param {uint} inputAmount
 * @param {address} fromSynth
 * @param {address} toToken
 * @param {object} wallet
 * @returns {unit} output
 */
export const swapSynthToAsset = (
  inputAmount,
  fromSynth,
  toToken,
  wallet,
) => async (dispatch) => {
  dispatch(routerLoading())
  const contract = getRouterContract(wallet)
  try {
    const gPrice = await getProviderGasPrice()
    const burnSynth = await contract.swapSynthToAsset(
      inputAmount,
      fromSynth,
      toToken,
      {
        gasPrice: gPrice,
      },
    )
    dispatch(payloadToDispatch(Types.ROUTER_BURN_SYNTH, burnSynth))
  } catch (error) {
    dispatch(errorToDispatch(Types.ROUTER_ERROR, `${error}.`))
  }
}
