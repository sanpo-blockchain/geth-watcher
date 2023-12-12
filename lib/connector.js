"use strict"

const debug = require("debug")("connector");
const Web3 = require("web3");
const createWebsocketProvider = (provider) => new Web3.providers.WebsocketProvider(provider);

const logger = require("./logger").getLogger();

class Connector {
  constructor(opts) {
    this.provider = opts.provider;
    this.web3 = null;
    this.healthState = false;
    this.chechInterval;
  }

  async connect() {
    logger.info("connect... " + this.provider);

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

  stopHealthCheck() {
    clearInterval(this.chechInterval);
    this.healthState = false;
  }

  restartHealthCheck() {
    this._healthCheck();
    this.healthState = true;
  }

  _healthCheck() {
    this.chechInterval = setInterval(() => {
      if (this.web3) {
        this.web3.eth.net.isListening()
          .then((result) => {
            debug("web3.eth.net.isListening: " + result);
          })
          .catch((e) => {
            logger.info("disconnected " + this.provider);
            this.web3?.currentProvider.disconnect();
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
    if (!this.web3) {
      logger.info("web3 is null");
      return Promise.resolve(false);
    }
    try {
      return await this.web3.eth.net.isListening();
    } catch (e) {
      logger.info("failed to web3.eth.net.isListening");
      return Promise.resolve(false);
    }
  }
}

module.exports = Connector
