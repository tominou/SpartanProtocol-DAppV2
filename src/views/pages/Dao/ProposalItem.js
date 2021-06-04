import { useWallet } from '@binance-chain/bsc-use-wallet'
import React from 'react'
import { useDispatch } from 'react-redux'
import { Button, Card, Row, Col, Progress } from 'reactstrap'
import { useBond } from '../../../store/bond'
import {
  finaliseProposal,
  removeVote,
  voteProposal,
} from '../../../store/dao/actions'
import { useDao } from '../../../store/dao/selector'
import { usePool } from '../../../store/pool/selector'
import { useSparta } from '../../../store/sparta/selector'
import { BN, formatFromUnits, formatFromWei } from '../../../utils/bigNumber'
import { getExplorerContract, getExplorerWallet } from '../../../utils/extCalls'
import { formatShortString } from '../../../utils/web3'
import { proposalTypes } from './types'

const ProposalItem = ({ proposal }) => {
  const dao = useDao()
  const sparta = useSparta()
  const pool = usePool()
  const bond = useBond()
  const wallet = useWallet()
  const dispatch = useDispatch()
  const type = proposalTypes.filter((i) => i.value === proposal.proposalType)[0]
  const getEndDate = () => {
    const timeStamp = BN(Date.now()).div(1000)
    const endDate = BN(proposal.timeStart).plus(dao.global.coolOffPeriod)
    const hoursAway = endDate.minus(timeStamp).div(60).div(60)
    return hoursAway.toFixed(0)
  }
  const status = () => {
    if (proposal.finalising && getEndDate() > 0) {
      return `${getEndDate()} hour cool-off remaining`
    }
    if (proposal.finalising && getEndDate() <= 0) {
      return `Ready for final vote count!`
    }
    return 'Requires more support'
  }

  const memberPercent =
    dao.member.weight && bond.member.weight
      ? BN(proposal.memberVotes)
          .div(BN(dao.member.weight).plus(bond.member.weight))
          .times(100)
          .toString()
      : '0'

  const totalPercent =
    dao.global.totalWeight && bond.global.weight
      ? BN(proposal.votes)
          .div(BN(dao.global.totalWeight).plus(bond.global.weight))
          .times(100)
          .toString()
      : '0'

  const weightClass = () => {
    if (totalPercent > (100 / 3) * 2) {
      return 'Majority'
    }
    if (totalPercent > 100 / 2) {
      return 'Quorum'
    }
    if (totalPercent > 100 / 6) {
      return 'Minority'
    }
    return 'Weak Support'
  }

  const getToken = (tokenAddress) =>
    pool.tokenDetails.filter((i) => i.address === tokenAddress)[0]

  const getPool = (poolAddress) =>
    getToken(
      pool.poolDetails.filter((i) => i.address === poolAddress)[0]
        ?.tokenAddress,
    )

  const getDetails = () => {
    // 'GET_SPARTA' = '2.5M SPARTA'
    if (proposal.proposalType === 'GET_SPARTA') {
      return '2.5M SPARTA'
    }
    // 'LIST_BOND', 'DELIST_BOND' = proposal.proposedAddress + 'token details'
    if (['LIST_BOND', 'DELIST_BOND'].includes(proposal.proposalType)) {
      return (
        <>
          <a
            href={getExplorerContract(proposal.proposedAddress)}
            target="_blank"
            rel="noreferrer"
            className="mr-2"
          >
            {formatShortString(proposal.proposedAddress)}
          </a>
          {getToken(proposal.proposedAddress)?.symbol}
        </>
      )
    }
    // 'FLIP_EMISSIONS' = 'on' or 'off'
    if (proposal.proposalType === 'FLIP_EMISSIONS') {
      return sparta.globalDetails.emitting ? 'off' : 'on'
    }
    // 'ADD_CURATED_POOL', 'REMOVE_CURATED_POOL' = proposal.proposedAddress + 'pool details'
    if (
      ['ADD_CURATED_POOL', 'REMOVE_CURATED_POOL'].includes(
        proposal.proposalType,
      )
    ) {
      return (
        <>
          <a
            href={getExplorerContract(proposal.proposedAddress)}
            target="_blank"
            rel="noreferrer"
            className="mr-2"
          >
            {formatShortString(proposal.proposedAddress)}
          </a>
          {getPool(proposal.proposedAddress)?.symbol}p
        </>
      )
    }
    // 'COOL_OFF', 'ERAS_TO_EARN' = proposal.param + type.units
    if (['COOL_OFF', 'ERAS_TO_EARN'].includes(proposal.proposalType)) {
      return `${proposal.param} ${type.units}`
    }
    // 'GRANT' = proposal.param + 'to' + proposal.proposedAddress
    if (proposal.proposalType === 'GRANT') {
      return (
        <>
          {proposal.param} SPARTA to
          <a
            href={getExplorerWallet(proposal.proposedAddress)}
            target="_blank"
            rel="noreferrer"
            className="ml-2"
          >
            {formatShortString(proposal.proposedAddress)}
          </a>
        </>
      )
    }
    // 'DAO', 'ROUTER', 'UTILS', 'RESERVE' = proposal.proposedAddress
    if (['DAO', 'ROUTER', 'UTILS', 'RESERVE'].includes(proposal.proposalType)) {
      return (
        <>
          <a
            href={getExplorerContract(proposal.proposedAddress)}
            target="_blank"
            rel="noreferrer"
            className="mr-2"
          >
            {formatShortString(proposal.proposedAddress)}
          </a>
        </>
      )
    }
    return '0'
  }

  return (
    <>
      <Col xs="auto">
        <Card className="card-body card-320 pt-3 pb-2 card-underlay">
          <Row className="mb-2">
            <Col xs="auto" className="pr-0 my-auto">
              <h4 className="my-auto">#{proposal.id}</h4>
            </Col>
            <Col>
              <h4 className="mb-0">{type.label}</h4>
              <p className="text-sm-label-alt">{status()}</p>
            </Col>
          </Row>
          <Row>
            <Col>
              <div className="output-card mb-2">{type.desc}</div>
            </Col>
          </Row>
          <Row>
            <Col>
              <div className="output-card mb-2">{getDetails()}</div>
            </Col>
          </Row>

          <Row className="my-1">
            <Col xs="auto" className="text-card">
              Your votes
            </Col>
            <Col className="text-right output-card">
              {formatFromWei(proposal.memberVotes)} (
              {formatFromUnits(memberPercent, 2)}%)
            </Col>
          </Row>

          <Row className="my-1">
            <Col xs="auto" className="text-card">
              Total votes
            </Col>
            <Col className="text-right output-card">
              {weightClass()} ({formatFromUnits(totalPercent, 2)}%)
            </Col>
          </Row>

          <div className="progress-container progress-primary my-2">
            <span className="progress-badge" />
            <Progress max="100" value={totalPercent} />
          </div>

          <Row>
            <Col className="px-1">
              <Button
                color="primary"
                className="btn-sm w-100"
                onClick={() => dispatch(voteProposal(proposal.id, wallet))}
                disabled={memberPercent >= 100}
              >
                Vote Up
              </Button>
            </Col>
            <Col className="px-1">
              <Button
                color="primary"
                className="btn-sm w-100"
                onClick={() => dispatch(removeVote(proposal.id, wallet))}
                disabled={memberPercent <= 0}
              >
                Vote Down
              </Button>
            </Col>
          </Row>
          <Row>
            <Col className="px-1">
              <Button
                color="secondary"
                className="btn-sm w-100"
                onClick={() => dispatch(finaliseProposal(proposal.id, wallet))}
                disabled={!proposal.finalising || getEndDate() > 0}
              >
                Count Votes
              </Button>
            </Col>
          </Row>
        </Card>
      </Col>
    </>
  )
}

export default ProposalItem
