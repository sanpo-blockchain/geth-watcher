"use strict";

const Web3 = require("web3");
const { spawn, execSync } = require('child_process');

const config = require("./config/environment");
const logger = require("./lib/logger").getLogger();
const Connector = require("./lib/connector");
let connector = null;

const sleep = (msec) => new Promise((resolve) => setTimeout(resolve, msec));
let prev;

const observe = async () => {
  logger.info("Observe <-- begin");
  try {
    let count = 0;
    prev = await connector.getBlockNumber();
    let current;
    const getBlockNumber = setInterval(async () => {
      current = await connector.getBlockNumber();
      if (prev === current) {
        count++;
        logger.warn(`Block number has not changed... number=${current.toLocaleString()}`);
        if (count > config.observe.threshold) {
          logger.info("Observe --> end");
          clearInterval(getBlockNumber);
          connector.disconnect();
          await reboot();
          observe();
        }
      } else {
        if (count > 0) {
          count = 0;
        }
      }
      prev = current;
    }, config.observe.interval);
  } catch (e) {
    console.log(e);
  }
}

const reboot = async () => {
  logger.info("Reboot GETH <-- begin");
  await stop();
  await start();
  logger.info("Reboot GETH --> end");
}

const stop = async () => {
  connector.stopHealthCheck();
  execSync(config.command.stop);
  logger.info("Executed shell script for stop geth...");
  logger.info("Wait 10 seconds, as it takes some time for geth to stop...");
  await sleep(10000); // Wait 10 seconds for stop
  while (await connector.isListening()) {
    await sleep(5000);
  }
  logger.info("GETH HTTP server stopped");
  logger.info("Wait 10 seconds, as it takes some time for the geth process to stop...");
  await sleep(10000); // Wait 10 seconds for stop
  logger.info("GETH stopped");
}

const start = async () => {
  logger.info("Starting GETH...");
  spawn(config.command.start, { detached: true });
  logger.info("Executed shell script for start geth...");
  logger.info("Wait 10 seconds, as it takes some time for geth to start...");
  await sleep(10000); // Wait 10 seconds for startup
  await connector.restartHealthCheck();
  let current = await connector.getBlockNumber();
  while (prev >= current) {
    logger.warn(`Block number has not changed... number=${current.toLocaleString()}`);
    await sleep(5000);
    current = await connector.getBlockNumber();
  }
}

(async () => {
  connector = new Connector({ provider: config.observe.url });
  await connector.connect();
  logger.info("start monitoring");
  observe();
})();
