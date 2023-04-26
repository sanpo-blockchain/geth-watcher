"use strict"

const debug = require("debug")("connector");
const Web3 = require("web3");
const createWebsocketProvider = (provider) => new Web3.providers.WebsocketProvider(provider);

class Connector {
  constructor(opts) {
    this.provider = opts.provider;
    this.web3 = null;
    this.healthState = false;
  }

  async connect() {
    debug("connect... " + this.provider);

    if (!this.healthState) {
      this._healthCheck();
    }
    this.healthState = true;
    this.web3 = new Web3(createWebsocketProvider(this.provider));
  }

  disconnect() {
    if (!this.web3) return;
    this.web3.currentProvider.disconnect();
    this.web3 = null;
  }

  _healthCheck() {
    setInterval(() => {
      if (this.web3) {
        this.web3.eth.net.isListening()
        .catch((e) => {
          debug("disconnected " + this.provider);
          this.web3.currentProvider.disconnect();
          this.web3 = null;
          const provider = createWebsocketProvider(this.provider);
          provider.on("connect", () => {
            this.connect();
          })
        });
      }

      if (!this.web3) {
        debug("Attempting to reconnect... " + this.provider);
        const provider = createWebsocketProvider(this.provider);
        provider.on("connect", () => {
          this.connect();
        })
      }
    }, 5 * 1000);
  }

  async getBlockNumber() {
    if (!this.web3) return 0;
    return await this.web3.eth.getBlockNumber();
  }

  async isListening() {
    if (!this.web3) return false;
    try {
      return await this.web3.eth.net.isListening();
    } catch (e) {
      return false;
    }
  }
}

module.exports = Connector
