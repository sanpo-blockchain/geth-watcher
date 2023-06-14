# geth-watcher

- [Description](#description)
- [How to start geth-watcher](#how-to-start-geth-watcher)
- [License](#license)

## Description

The geth-watcher connects to the GETH node in the local environment and checks at regular intervals that the block number continues to increase.

If the block number remains unchanged, restart the connecting GETH node.

## How to start geth-watcher

recommended system requirements:  
- OS: Ubuntu 20.04 LTS.
- Node.js v18.15.0 or higher.

1. `git clone https://github.com/sanpo-blockchain/geth-watcher.git`
2. `cd geth-watcher/`
3. `npm install`
4. create shell scripts for GETH startup and GETH shutdown to be used by geth-watcher.
5. config your environment. (See [Environment Variables](#environment-variables).)
6. `node ./index.js`

### Sample Shell Scripts.
- startup shell script
```
#!/bin/bash
set -u
set -e

nohup geth --datadir ./data --nodiscover --syncmode full --allow-insecure-unlock --mine --miner.threads 1 --unlock 0 --password passwords.txt --ws --ws.addr localhost --ws.api admin,db,eth,debug,miner,net,shh,txpool,personal,web3 --ws.port 8546 --ws.origins "*" --ws.rpcprefix "/ws" --ethstats monitorID:sanpo@127.0.0.18:53000 2>>./data/gethlog &
```
- shutdown shell script
```
#!/bin/bash

ps aux | grep geth | grep datadir | awk '{print "kill -INT", $2}' | sh
```

### Environment Variables.

You must customize the behavior of geth-watcher using `config\environment.ts`.

- `observe.url` - Websocket server endpoint of the geth node to be monitored.<br>
  For example - `ws://127.0.0.1:8546/ws`
- `observe.interval` - Interval to check block numbers (in milliseconds).<br>
  For example - `10000`
- `observe.threshold` - Number of checks NG to restart GETH.<br>
Restart GETH if the check of the block number is NG for the number of consecutive times specified here.<br>
  For example - `3`
- `command.start` - Full path of the GETH startup shell script.<br>
  For example - `/home/ubuntu/start.sh`
- `command.stop` - Full path of the GETH shutdown shell script.<br>
  For example - `/home/ubuntu/stop.sh`

## License

geth-watcher is released under the MIT License.
