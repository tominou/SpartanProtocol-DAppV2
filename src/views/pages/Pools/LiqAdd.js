/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useWallet } from '@binance-chain/bsc-use-wallet'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Card,
  Col,
  FormControl,
  InputGroup,
  Nav,
  Row,
} from 'react-bootstrap'
import AssetSelect from '../../../components/AssetSelect/AssetSelect'
import { usePool } from '../../../store/pool'
import { getAddresses, getItemFromArray } from '../../../utils/web3'
import {
  BN,
  convertFromWei,
  convertToWei,
  formatFromUnits,
  formatFromWei,
} from '../../../utils/bigNumber'
import {
  calcFeeBurn,
  calcLiquidityHoldings,
  calcLiquidityUnits,
  calcSwapFee,
  calcValueInBase,
  calcValueInToken,
} from '../../../utils/web3Utils'
import SwapPair from '../Swap/SwapPair'
import { useWeb3 } from '../../../store/web3'
import { addLiquidity, addLiquiditySingle } from '../../../store/router/actions'
import Approval from '../../../components/Approval/Approval'
import HelmetLoading from '../../../components/Loaders/HelmetLoading'
import { useSparta } from '../../../store/sparta'
import { Icon } from '../../../components/Icons/icons'

const LiqAdd = () => {
  const { t } = useTranslation()
  const wallet = useWallet()
  const dispatch = useDispatch()
  const web3 = useWeb3()
  const pool = usePool()
  const addr = getAddresses()
  const sparta = useSparta()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('addTab1')
  const [assetAdd1, setAssetAdd1] = useState('...')
  const [assetAdd2, setAssetAdd2] = useState('...')
  const [poolAdd1, setPoolAdd1] = useState('...')
  const [outputLp, setOutputLp] = useState('0.00')
  const [assetParam1, setAssetParam1] = useState(
    new URLSearchParams(location.search).get(`asset1`),
  )

  const tryParse = (data) => {
    try {
      return JSON.parse(data)
    } catch (e) {
      return pool.poolDetails[0]
    }
  }

  useEffect(() => {
    const { poolDetails } = pool
    const getAssetDetails = () => {
      if (poolDetails.length > 0 && activeTab === 'addTab1') {
        window.localStorage.setItem('assetType1', 'token')
        window.localStorage.setItem('assetType2', 'token')
        window.localStorage.setItem('assetType3', 'pool')

        let asset1 = tryParse(window.localStorage.getItem('assetSelected1'))
        let asset2 = tryParse(window.localStorage.getItem('assetSelected2'))
        let asset3 = tryParse(window.localStorage.getItem('assetSelected3'))

        if (poolDetails.find((asset) => asset.tokenAddress === assetParam1)) {
          ;[asset1] = poolDetails.filter(
            (asset) => asset.tokenAddress === assetParam1,
          )
          setAssetParam1('')
        }
        asset1 =
          asset1 &&
          asset1.tokenAddress !== addr.spartav2 &&
          pool.poolDetails.find((x) => x.tokenAddress === asset1.tokenAddress)
            ? asset1
            : { tokenAddress: addr.bnb }
        asset2 = { tokenAddress: addr.spartav2 }
        asset3 =
          asset1.tokenAddress !== addr.spartav2
            ? asset1
            : { tokenAddress: addr.bnb }

        asset1 = getItemFromArray(asset1, pool.poolDetails)
        asset2 = getItemFromArray(asset2, pool.poolDetails)
        asset3 = getItemFromArray(asset3, pool.poolDetails)

        setAssetAdd1(asset1)
        setAssetAdd2(asset2)
        setPoolAdd1(asset3)

        window.localStorage.setItem('assetSelected1', JSON.stringify(asset1))
        window.localStorage.setItem('assetSelected2', JSON.stringify(asset2))
        window.localStorage.setItem('assetSelected3', JSON.stringify(asset3))
      } else if (poolDetails && activeTab === 'addTab2') {
        window.localStorage.setItem('assetType1', 'token')
        window.localStorage.setItem('assetType3', 'pool')

        let asset1 = tryParse(window.localStorage.getItem('assetSelected1'))
        let asset3 = tryParse(window.localStorage.getItem('assetSelected3'))

        asset1 =
          asset1 &&
          pool.poolDetails.find((x) => x.tokenAddress === asset1.tokenAddress)
            ? asset1
            : { tokenAddress: addr.bnb }
        asset3 = asset1.tokenAddress !== addr.spartav2 ? asset1 : asset3

        asset1 = getItemFromArray(asset1, pool.poolDetails)
        asset3 = getItemFromArray(asset3, pool.poolDetails)

        setAssetAdd1(asset1)
        setPoolAdd1(asset3)

        window.localStorage.setItem('assetSelected1', JSON.stringify(asset1))
        window.localStorage.setItem('assetSelected3', JSON.stringify(asset3))
      }
    }

    getAssetDetails()
  }, [
    pool.poolDetails,
    window.localStorage.getItem('assetSelected1'),
    window.localStorage.getItem('assetSelected2'),
    window.localStorage.getItem('assetSelected3'),
    activeTab,
  ])

  const getToken = (tokenAddress) =>
    pool.tokenDetails.filter((i) => i.address === tokenAddress)[0]

  const addInput1 = document.getElementById('addInput1')
  const addInput2 = document.getElementById('addInput2')
  const addInput3 = document.getElementById('addInput3')

  const clearInputs = (focusAfter) => {
    setOutputLp('0.00')
    if (addInput1) {
      addInput1.value = ''
    }
    if (addInput2) {
      addInput2.value = ''
    }
    if (addInput3) {
      addInput3.value = ''
    }
    if (focusAfter === 1) {
      addInput1.focus()
    }
    if (focusAfter === 2) {
      addInput2.focus()
    }
  }

  const toggle = (tab) => {
    if (activeTab !== tab) setActiveTab(tab)
    clearInputs(1)
  }

  const getBalance = (asset) => {
    if (asset === 1) {
      return getToken(assetAdd1?.tokenAddress)?.balance
    }
    if (asset === 2) {
      return getToken(assetAdd2?.tokenAddress)?.balance
    }
    return poolAdd1?.balance
  }

  const getFeeBurn = (_amount) => {
    const burnFee = calcFeeBurn(sparta.globalDetails.feeOnTransfer, _amount)
    return burnFee
  }

  //= =================================================================================//
  // 'Add Both' Functions (Re-Factor)

  const getAddBothOutputLP = () => {
    if (addInput1 && addInput2 && assetAdd1) {
      return convertFromWei(
        calcLiquidityUnits(
          BN(convertToWei(addInput2?.value)).minus(
            getFeeBurn(convertToWei(addInput2?.value)),
          ),
          convertToWei(addInput1?.value),
          assetAdd1?.baseAmount,
          assetAdd1?.tokenAmount,
          assetAdd1?.poolUnits,
        ),
      )
    }
    return '0.00'
  }

  //= =================================================================================//
  // 'Add Single' Functions (Re-Factor)

  const getAddSingleOutputLP = () => {
    if (addInput1 && assetAdd1) {
      return convertFromWei(
        calcLiquidityUnits(
          assetAdd1.tokenAddress === addr.spartav2
            ? BN(convertToWei(addInput1?.value)).minus(
                getFeeBurn(convertToWei(addInput1?.value)),
              )
            : '0',
          assetAdd1.tokenAddress !== addr.spartav2
            ? convertToWei(addInput1?.value)
            : '0',
          poolAdd1?.baseAmount,
          poolAdd1?.tokenAmount,
          poolAdd1?.poolUnits,
        ),
      )
    }
    return '0.00'
  }

  const getAddSingleSwapFee = () => {
    if (addInput1 && assetAdd1) {
      const swapFee = calcSwapFee(
        convertToWei(BN(addInput1?.value).div(2)),
        poolAdd1.tokenAmount,
        poolAdd1.baseAmount,
        assetAdd1.tokenAddress !== addr.spartav2,
      )
      return swapFee
    }
    return '0.00'
  }

  const getInput1ValueUSD = () => {
    if (assetAdd1?.tokenAddress !== addr.spartav2 && addInput1?.value) {
      return calcValueInBase(
        poolAdd1.tokenAmount,
        poolAdd1.baseAmount,
        convertToWei(addInput1.value),
      ).times(web3.spartaPrice)
    }
    if (assetAdd1?.tokenAddress === addr.spartav2 && addInput1?.value) {
      return BN(convertToWei(addInput1.value)).times(web3.spartaPrice)
    }
    return '0.00'
  }

  const getInput2ValueUSD = () => {
    if (assetAdd2 && addInput2?.value) {
      return BN(convertToWei(addInput2.value)).times(web3.spartaPrice)
    }
    return '0.00'
  }

  const getLpValueBase = () => {
    if (assetAdd1 && addInput1?.value) {
      return calcLiquidityHoldings(
        poolAdd1.baseAmount,
        outputLp,
        poolAdd1.poolUnits,
      )
    }
    return '0.00'
  }

  const getLpValueToken = () => {
    if (assetAdd1 && addInput1?.value) {
      return calcLiquidityHoldings(
        poolAdd1.tokenAmount,
        outputLp,
        poolAdd1.poolUnits,
      )
    }
    return '0.00'
  }

  const getLpValueUSD = () => {
    if (assetAdd1 && addInput1?.value) {
      return BN(
        calcValueInBase(
          poolAdd1?.tokenAmount,
          poolAdd1?.baseAmount,
          getLpValueToken(),
        ),
      )
        .plus(getLpValueBase())
        .times(web3.spartaPrice)
    }

    return '0.00'
  }

  //= =================================================================================//
  // General Functions

  const handleInputChange = () => {
    if (activeTab === 'addTab1') {
      if (addInput2 && addInput2 !== document.activeElement) {
        addInput2.value = calcValueInBase(
          assetAdd1.tokenAmount,
          assetAdd1.baseAmount,
          addInput1.value > 0 ? addInput1.value : '0.00',
        )
        setOutputLp(convertToWei(getAddBothOutputLP()))
      } else if (addInput1 && addInput1 !== document.activeElement) {
        addInput1.value = calcValueInToken(
          assetAdd1.tokenAmount,
          assetAdd1.baseAmount,
          addInput2.value > 0 ? addInput2.value : '0.00',
        )
        setOutputLp(convertToWei(getAddBothOutputLP()))
      }
    } else if (activeTab === 'addTab2') {
      if (addInput1?.value && addInput3) {
        setOutputLp(convertToWei(getAddSingleOutputLP()))
        addInput3.value = getAddSingleOutputLP()
      }
    }
  }

  const getRateSlip = () => {
    if (assetAdd1 && addInput1?.value > 0) {
      return BN(getLpValueUSD())
        .div(getInput1ValueUSD())
        .minus('1')
        .times('100')
    }
    return '0.00'
  }

  const handleTokenInputChange = (e) => {
    e.currentTarget.value = e.currentTarget.value
      .replace(/[^0-9.]/g, '')
      .replace(/(\..*?)\..*/g, '$1')
  }

  useEffect(() => {
    handleInputChange()
  }, [
    addInput1?.value,
    addInput2?.value,
    assetAdd1,
    assetAdd2,
    poolAdd1,
    activeTab,
  ])

  const handleAddLiquidity = () => {
    if (
      assetAdd1?.tokenAddress === addr.bnb ||
      assetAdd1?.tokenAddress === addr.wbnb
    ) {
      const balance = getToken(addr.bnb)?.balance
      if (
        BN(balance)
          .minus(convertToWei(addInput1?.value))
          .isLessThan('5000000000000000')
      ) {
        addInput1.value = convertFromWei(BN(balance).minus('5000000000000000'))
      }
    }
    if (activeTab === 'addTab1') {
      dispatch(
        addLiquidity(
          convertToWei(addInput2.value),
          convertToWei(addInput1.value),
          assetAdd1.tokenAddress,
          wallet,
        ),
      )
    } else {
      dispatch(
        addLiquiditySingle(
          convertToWei(addInput1.value),
          assetAdd1.tokenAddress === addr.spartav2,
          poolAdd1.tokenAddress,
          wallet,
        ),
      )
    }
  }

  return (
    <Row>
      <Col xs="auto">
        <Card xs="auto" className="card-480">
          <Card.Header className="p-0 border-0 mb-3">
            <Nav activeKey={activeTab} fill className="rounded-top">
              <Nav.Item key="addTab1" className="rounded-top">
                <Nav.Link
                  className="rounded-top"
                  eventKey="addTab1"
                  onClick={() => {
                    toggle('addTab1')
                  }}
                >
                  {t('addBoth')}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item key="addTab2" className="rounded-top">
                <Nav.Link
                  className="rounded-top"
                  eventKey="addTab2"
                  onClick={() => {
                    toggle('addTab2')
                  }}
                >
                  {t('addSingle')}
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col xs="12" className="px-1 px-sm-3">
                <Card style={{ backgroundColor: '#25212d' }}>
                  <Card.Body>
                    <Row className="">
                      <Col className="text-sm-label">{t('add')}</Col>
                      <Col
                        className="text-sm-label float-end text-end"
                        role="button"
                        aria-hidden="true"
                        onClick={() => {
                          addInput1.value = convertFromWei(getBalance(1))
                        }}
                      >
                        {t('balance')}:{' '}
                        {pool.poolDetails && formatFromWei(getBalance(1))}{' '}
                      </Col>
                    </Row>

                    <Row className="my-1">
                      <Col>
                        <InputGroup className="">
                          <InputGroup.Text>
                            <AssetSelect
                              priority="1"
                              filter={['token']}
                              blackList={
                                activeTab === 'addTab1'
                                  ? [addr.spartav1, addr.spartav2]
                                  : []
                              }
                            />
                          </InputGroup.Text>
                          <FormControl
                            className="text-end ms-0"
                            type="number"
                            placeholder={`${t('add')}...`}
                            id="addInput1"
                            autoComplete="off"
                            autoCorrect="off"
                            onInput={(e) => handleTokenInputChange(e)}
                          />
                          <InputGroup.Text
                            role="button"
                            tabIndex={-1}
                            onKeyPress={() => clearInputs(1)}
                            onClick={() => clearInputs(1)}
                          >
                            <Icon icon="close" size="12" fill="grey" />
                          </InputGroup.Text>
                        </InputGroup>
                        <div className="text-end text-sm-label pt-1">
                          ~$
                          {addInput1?.value
                            ? formatFromWei(getInput1ValueUSD(), 2)
                            : '0.00'}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                <Row style={{ height: '2px' }}>
                  {activeTab === 'addTab1' && (
                    <Icon
                      icon="plus"
                      size="25"
                      fill="#fb2715"
                      className="mx-auto position-relative"
                      style={{ height: '35px', top: '-18px', zIndex: '1000' }}
                    />
                  )}
                  {activeTab === 'addTab2' && (
                    <Icon
                      icon="swapAdd"
                      size="25"
                      fill="#fb2715"
                      className="mx-auto position-relative"
                      style={{ height: '35px', top: '-18px', zIndex: '1000' }}
                    />
                  )}
                </Row>

                {activeTab === 'addTab1' && (
                  <Card style={{ backgroundColor: '#25212d' }}>
                    <Card.Body>
                      <Row className="">
                        <Col className="text-sm-label">{t('receive')}</Col>
                        <Col
                          className="text-sm-label float-end text-end"
                          role="button"
                          aria-hidden="true"
                          onClick={() => {
                            addInput2.focus()
                            addInput2.value = convertFromWei(getBalance(2))
                          }}
                        >
                          {t('balance')}:{' '}
                          {pool.poolDetails && formatFromWei(getBalance(2))}
                        </Col>
                      </Row>

                      <Row className="my-1">
                        <Col>
                          <InputGroup className="">
                            <InputGroup.Text>
                              <AssetSelect
                                priority="2"
                                filter={['token']}
                                whiteList={[addr.spartav2]}
                                disabled={activeTab === 'addTab1'}
                              />
                            </InputGroup.Text>
                            <FormControl
                              className="text-end ms-0"
                              type="number"
                              placeholder={`${t('add')}...`}
                              id="addInput2"
                              autoComplete="off"
                              autoCorrect="off"
                              onInput={(e) => handleTokenInputChange(e)}
                            />
                            <InputGroup.Text
                              role="button"
                              tabIndex={-1}
                              onKeyPress={() => clearInputs(2)}
                              onClick={() => clearInputs(2)}
                            >
                              <Icon icon="close" size="12" fill="grey" />
                            </InputGroup.Text>
                          </InputGroup>
                          <div className="text-end text-sm-label pt-1">
                            ~$
                            {addInput2?.value
                              ? formatFromWei(getInput2ValueUSD(), 2)
                              : '0.00'}
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {activeTab === 'addTab2' && (
                  <Card style={{ backgroundColor: '#25212d' }}>
                    <Card.Body>
                      <Row className="">
                        <Col className="text-sm-label">{t('add')}</Col>
                        <Col className="text-sm-label float-end text-end">
                          {t('balance')}:{' '}
                          {pool.poolDetails && formatFromWei(getBalance(3))}
                        </Col>
                      </Row>

                      <Row className="my-1">
                        <Col>
                          <InputGroup className="">
                            <InputGroup.Text>
                              <AssetSelect
                                priority="3"
                                filter={['pool']}
                                disabled={
                                  activeTab === 'addTab1' ||
                                  assetAdd1.tokenAddress !== addr.spartav2
                                }
                              />
                            </InputGroup.Text>
                            <FormControl
                              className="text-end ms-0"
                              type="number"
                              placeholder="0.00"
                              id="addInput3"
                              disabled
                            />
                          </InputGroup>
                          <div className="text-end text-sm-label pt-1">
                            ~$
                            {addInput1?.value
                              ? formatFromWei(getLpValueUSD(), 2)
                              : '0.00'}
                            {' ('}
                            {addInput1?.value
                              ? formatFromUnits(getRateSlip(), 2)
                              : '0.00'}
                            {'%)'}
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {pool.poolDetails && (
                  <>
                    <Row className="mb-2 mt-3">
                      <Col xs="auto">
                        <span className="text-card">{t('add')}</span>
                      </Col>
                      <Col className="text-end">
                        <span className="text-card">
                          {addInput1?.value > 0
                            ? formatFromUnits(addInput1?.value, 6)
                            : '0.00'}{' '}
                          {getToken(assetAdd1.tokenAddress)?.symbol}
                        </span>
                      </Col>
                    </Row>

                    {activeTab === 'addTab1' && (
                      <Row className="mb-2">
                        <Col xs="auto">
                          <span className="text-card">{t('add')}</span>
                        </Col>
                        <Col className="text-end">
                          <span className="text-card">
                            {addInput2?.value > 0
                              ? formatFromUnits(addInput2?.value, 6)
                              : '0.00'}{' '}
                            <span className="">SPARTA</span>
                          </span>
                        </Col>
                      </Row>
                    )}

                    {activeTab === 'addTab2' && (
                      <Row className="mb-2">
                        <Col xs="auto" className="title-card">
                          <span className="text-card">{t('fee')}</span>
                        </Col>
                        <Col className="text-end">
                          <span className="text-card">
                            {assetAdd1 && getAddSingleSwapFee() > 0
                              ? formatFromWei(getAddSingleSwapFee(), 6)
                              : '0.00'}{' '}
                            <span className="">SPARTA</span>
                          </span>
                        </Col>
                      </Row>
                    )}

                    <Row className="">
                      <Col xs="auto" className="title-card">
                        <span className="subtitle-card">{t('receive')}</span>
                      </Col>
                      <Col className="text-end">
                        <span className="subtitle-card">
                          {outputLp > 0 ? formatFromWei(outputLp, 6) : '0.00'}{' '}
                          <span className="output-card">
                            {getToken(assetAdd1.tokenAddress)?.symbol}p
                          </span>
                        </span>
                      </Col>
                    </Row>
                  </>
                )}
                {!pool.poolDetails && (
                  <HelmetLoading height="150px" width="150px" />
                )}
              </Col>
            </Row>
          </Card.Body>

          <Card.Footer>
            <Row className="text-center">
              {assetAdd1?.tokenAddress &&
                assetAdd1?.tokenAddress !== addr.bnb &&
                wallet?.account &&
                addInput1?.value && (
                  <Approval
                    tokenAddress={assetAdd1?.tokenAddress}
                    symbol={getToken(assetAdd1.tokenAddress)?.symbol}
                    walletAddress={wallet?.account}
                    contractAddress={addr.router}
                    txnAmount={convertToWei(addInput1?.value)}
                    assetNumber="1"
                  />
                )}
              <Col xs="12" sm="4" md="12" className="hide-if-siblings">
                <Button
                  className="w-100"
                  disabled={
                    addInput1?.value <= 0 ||
                    BN(convertToWei(addInput1?.value)).isGreaterThan(
                      getBalance(1),
                    ) ||
                    BN(convertToWei(addInput2?.value)).isGreaterThan(
                      getBalance(2),
                    ) ||
                    poolAdd1.baseAmount <= 0
                  }
                  onClick={() => handleAddLiquidity()}
                >
                  {t('joinPool')}
                </Button>
              </Col>
              {assetAdd2?.tokenAddress &&
                assetAdd2?.tokenAddress !== addr.bnb &&
                wallet?.account &&
                addInput2?.value && (
                  <Approval
                    tokenAddress={assetAdd2?.tokenAddress}
                    symbol={getToken(assetAdd2.tokenAddress)?.symbol}
                    walletAddress={wallet?.account}
                    contractAddress={addr.router}
                    txnAmount={convertToWei(addInput2?.value)}
                    assetNumber="2"
                  />
                )}
            </Row>
          </Card.Footer>
        </Card>
      </Col>
      {pool.poolDetails && (
        <Col xs="auto">
          <SwapPair assetSwap={poolAdd1} />
        </Col>
      )}
    </Row>
  )
}

export default LiqAdd
