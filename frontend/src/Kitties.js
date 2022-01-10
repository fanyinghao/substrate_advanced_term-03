import React, { useEffect, useState } from 'react'
import { Form, Grid } from 'semantic-ui-react'

import { useSubstrate } from './substrate-lib'
import { TxButton } from './substrate-lib/components'

import KittyCards from './KittyCards'

const convertToKittyIndex = entry =>
  entry[0].args.map((k) => k.toHuman())

const constructKitty = (id, { dna, price, gender, owner, deposit }) => ({
  id: id,
  dna,
  price: price.toJSON(),
  gender: gender.toJSON(),
  owner: owner.toJSON(),
  deposit: deposit.toJSON()
})

export default function Kitties(props) {
  const { api, keyring } = useSubstrate()
  const { accountPair } = props

  const [kittyCount, setKittyCount] = useState(0)
  const [kitties, setKitties] = useState([])
  const [status, setStatus] = useState('')

  const fetchKitties = () => {
    // 你需要取得：
    //   - 共有多少只猫咪
    //   - 每只猫咪的主人是谁
    //   - 每只猫咪的 DNA 是什么，用来组合出它的形态

    let unSub = null

    const asyncFetch = async () => {
      unSub = await api.query.kittiesModule.kittiesCount(async count => {
        setKittyCount(count.toJSON())
      })

      const kitties = await api.query.kittiesModule.kitties.entries()
      const owners = await api.query.kittiesModule.owner.entries()
      console.log('owners', owners)

      const ownerMap = {}
      owners.forEach(owner => {
        ownerMap[owner[0].toJSON()] = owner[0].toJSON()
      })
      console.log('ownerMap', ownerMap)

      const result = kitties.map((item, idx) => {
        const key = item[0].toJSON()
        return {
          id: idx,
          dna: item[0].slice(32),
          owner: item[0].toJSON().slice(0, 32)
        }
      })
      console.log('result', result)

      setKitties(result)
    }

    asyncFetch()

    return () => {
      unSub && unSub()
    }
  }

  const populateKitties = () => {
    //  ```javascript
    //  const kitties = [{
    //    id: 0,
    //    dna: ...,
    //    owner: ...
    //  }, { id: ..., dna: ..., owner: ... }]
    //  ```
    // 这个 kitties 会传入 <KittyCards/> 然后对每只猫咪进行处理

    const asyncFetch = async () => {
      const kitties = await api.query.kittiesModule.kitties.entries()
      console.log('arr', kitties)
      setKitties(kitties.map(async (item, idx) => {
        const key = item[0].toJSON()
        console.log('key', key)
        const owner = await api.query.kittiesModule.owner.entriesAt(key, 1)
        console.log('ownder', key, owner)
        return {
          id: idx,
          dna: item[1].toJSON(),
          owner: key.toJSON()
        }
      }))
    }

    // asyncFetch()

    // return the unsubscription cleanup function
    return () => {
      asyncFetch && asyncFetch()
    }
  }

  useEffect(fetchKitties, [api, keyring])
  // useEffect(populateKitties, [api, kittyCount])

  return <Grid.Column width={16}>
    <h1>小毛孩</h1>
    <KittyCards kitties={kitties} accountPair={accountPair} setStatus={setStatus} />
    <Form style={{ margin: '1em 0' }}>
      <Form.Field style={{ textAlign: 'center' }}>
        <TxButton
          accountPair={accountPair} label='创建小毛孩' type='SIGNED-TX' setStatus={setStatus}
          attrs={{
            palletRpc: 'kittiesModule',
            callable: 'create',
            inputParams: [],
            paramFields: []
          }}
        />
      </Form.Field>
    </Form>
    <div style={{ overflowWrap: 'break-word' }}>{status}</div>
  </Grid.Column>
}
