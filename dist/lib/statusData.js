'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _DataCollector = require('./DataCollector');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const perPage = _config2.default.api.perPage;
const statusCollection = _config2.default.blocks.statusCollection;
const blocksCollection = _config2.default.blocks.blocksCollection;

class Status extends _DataCollector.DataCollector {
  constructor(db) {
    super(db, { perPage, statusCollection });
    this.state = {};
    this.addItem(statusCollection, 'Status', null, true);
    this.addItem(blocksCollection, 'Blocks', null, true);
  }
  tick() {
    this.updateState().then(newState => {
      if (newState) {
        this.events.emit('newStatus', this.formatData(newState));
      }
    });
  }
  getState() {
    return this.formatData(this.state);
  }
  getBlocksServiceStatus() {
    return this.Status.find({}, { timestamp: -1 }, 1).then(res => {
      res = res.DATA[0];
      delete res._id;
      return res;
    });
  }
  async updateState() {
    let [status, last, high, dbBlocks] = await Promise.all([this.getBlocksServiceStatus(), this.getLastblockReceived(), this.getHighestBlock(), this.getTotalBlocks()]);
    status = Object.assign(status, {
      dbLastBlockReceived: last.number,
      dbLastBlockReceivedTime: last._received,
      dbHighBlock: high.number,
      dbBlocks,
      dbMissingBlocks: high.number + 1 - dbBlocks
    });
    let state = this.state;
    let changed = Object.keys(status).find(k => status[k] !== state[k]);
    if (changed) {
      status.dbTime = Date.now();
      this.state = status;
      return status;
    }
  }
  getHighestBlock() {
    return this.Blocks.find({}, { number: -1 }, 1).then(hBlock => hBlock.DATA[0]);
  }
  getLastblockReceived() {
    return this.Blocks.find({}, { _received: -1 }, 1).then(lastBlock => lastBlock.DATA[0]);
  }
  getTotalBlocks() {
    return this.Blocks.db.count({});
  }
}

exports.default = Status;