import Address from './Address'
import { isAddress } from '../../lib/utils'

export class Addresses {
  constructor ({ nod3, initConfig, collections }) {
    this.collections = collections
    this.nod3 = nod3
    this.initConfig = initConfig
    this.addresses = {}
  }
  add (address, options = {}) {
    if (!isAddress(address)) throw new Error(`Invalid address ${address}`)
    if (!this.addresses[address]) {
      options = options || {}
      let { nod3, initConfig, collections } = this
      options = Object.assign(options, { nod3, initConfig, collections })
      this.addresses[address] = new Address(address, options)
    }
    return this.addresses[address]
  }

  list () {
    return Object.values(this.addresses)
  }

  async fetch (forceFetch) {
    try {
      let addresses = this.list()
      for (let address of addresses) {
        await address.fetch(forceFetch)
      }
      return addresses.map(a => a.getData())
    } catch (err) {
      return Promise.reject(err)
    }
  }
  async save () {
    try {
      await this.fetch()
      let addresses = this.list()
      let result = await Promise.all([...addresses.map(a => a.save())])
      return result
    } catch (err) {
      return Promise.reject(err)
    }
  }
}

export default Addresses
