import { DataCollectorItem } from '../lib/DataCollector'
import config from '../../lib/config'
const { remascAddress, bridgeAddress } = config
export class Event extends DataCollectorItem {
  constructor (collection, key, parent) {
    // const sortable = { timestamp: -1 }
    super(collection, key, parent)
    this.publicActions = {
      /**
       * @swagger
       * /api?module=events&action=getEvent:
       *    get:
       *      description: get event data
       *      tags:
       *        - events
       *      parameters:
       *        - name: module
       *          in: query
       *          required: true
       *          default: events
       *        - name: action
       *          in: query
       *          required: true
       *          default: getEvent
       *        - name: _id
       *          in: query
       *          schema:
       *            type: string
       *      responses:
       *        400:
       *          description: invalid request
       *        200:
       *          description: event data
       *        404:
       *          description: unknown event
      */
      getEvent: async params => {
        try {
          const { _id } = params
          if (!_id) throw new Error('invalid _id')
          let data = await this.getOne({ _id })
          if (!data || !data.data) throw new Error(`Event ${_id} does not exist`)
          const address = data.data.address
          data = await this.parent.addAddressData(address, data)
          return data
        } catch (err) {
          return Promise.reject(err)
        }
      },
      /**
       * @swagger
       * /api?module=events&action=getEventsByAddress:
       *    get:
       *      description: get events by address
       *      tags:
       *        - events
       *      parameters:
       *        - name: module
       *          in: query
       *          required: true
       *          default: events
       *        - name: action
       *          in: query
       *          required: true
       *          default: getEventsByAddress
       *        - $ref: '#/parameters/address'
       *        - name: contract
       *          in: query
       *          required: false
       *          schema:
       *            type: string
       *            example: "0x0000000000000000000000000000000001000008"
       *        - name: signatures
       *          in: query
       *          required: false
       *          description: filter by event's signatures
       *          schema:
       *            type: array
       *            example:
       *              e19260aff97b920c7df27010903aeb9c8d2be5d310a2c67824cf3f15396e4c16
       *      responses:
       *        400:
       *          description: invalid request
       *        200:
       *          description: events array
       *        404:
       *          description: unknown block
      */
      getEventsByAddress: async params => {
        const { address, signatures, contract } = params
        if (address) {
          let query = { args: address }

          // search by events signatures
          if (Array.isArray(signatures)) {
            // skip remasc & bridge events
            if (address !== remascAddress && address !== bridgeAddress) {
              query.signature = { $in: signatures }
            }
          }

          if (contract) query.address = contract

          let res = await this.getPageData(query, params)
          if (res.data) {
            let addresses = new Set(res.data.map(d => d.address))
            addresses = [...addresses.values()]
            let addrData = await this.parent.Address.find({ address: { $in: addresses } })
            let { data } = addrData
            if (data) {
              res.data = res.data.map(d => {
                d._addressData = data.find(a => a.address === d.address)
                return d
              })
            }
          }
          return res
        }
      },
      /**
       * @swagger
       * /api?module=events&action=getAllEventsByAddress:
       *    get:
       *      description: get events by address
       *      tags:
       *        - events
       *      parameters:
       *        - name: module
       *          in: query
       *          required: true
       *          default: events
       *        - name: action
       *          in: query
       *          required: true
       *          default: getAllEventsByAddress
       *        - $ref: '#/parameters/address'
       *      responses:
       *        400:
       *          description: invalid request
       *        200:
       *          description: events array
       *        404:
       *          description: unknown block
      */
      getAllEventsByAddress: async params => {
        const { address } = params
        if (address) {
          return this.getPageData({ $or: [{ address }, { args: address }] }, params)
        }
      }
    }
  }
}

export default Event