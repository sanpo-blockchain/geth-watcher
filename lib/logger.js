"use strict"

const log4js = require("log4js");

function getLogger() {
  log4js.configure(logConfig());
  return log4js.getLogger();
}

const logConfig = () => {
  return {
    appenders: {
      "out": {
        type: "stdout",
        layout: {
          type: "pattern",
          pattern: "[%d] [%p] : %m"
        }
      }
    },
    categories: { default: { appenders: ['out'], level: 'debug' } }
  }
}

module.exports = {
  getLogger,
}
