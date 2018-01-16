/**
 * @file server.ts
 * @class Server
 * @author Pasquelin Alban
 * @version 1.0.0
 */
import 'dotenv/config';

import * as api from 'binance';
import * as express from 'express';
import * as http from 'http';
import * as socketio from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const SYMBOL: string = String(process.env.ALTCOIN) + String(process.env.COIN);

const binanceRest = new api.BinanceRest({
  key: String(process.env.APIKEY),
  secret: String(process.env.APISECRET),
});
const binanceWS = new api.BinanceWS(true);

const streams = binanceWS.streams;

binanceWS.onCombinedStream(
  [
    streams.depth(SYMBOL),
    streams.depthLevel(SYMBOL, 5),
    streams.kline(SYMBOL, '5m'),
    streams.aggTrade(SYMBOL),
    streams.trade(SYMBOL),
    streams.ticker(SYMBOL),
    streams.allTickers()
  ],
  (streamEvent) => {
    switch(streamEvent.stream) {
      case streams.depth(SYMBOL):
        io.sockets.emit('depth', streamEvent.data);
        break;
      case streams.depthLevel(SYMBOL, 5):
        io.sockets.emit('depthLevel', streamEvent.data);
        break;
      case streams.kline(SYMBOL, '5m'):
        io.sockets.emit('kline', streamEvent.data);
        break;
      case streams.aggTrade(SYMBOL):
        io.sockets.emit('aggTrade', streamEvent.data);
        break;
      case streams.trade(SYMBOL):
        io.sockets.emit('trade', streamEvent.data);
        break;
      case streams.ticker(SYMBOL):
        io.sockets.emit('ticker', streamEvent.data);
        break;
      case streams.allTickers():
        io.sockets.emit('allTickers', streamEvent.data);
        break;
    }
  }
);

io.sockets.on('connection', (socket) => {
  console.log('Un client est connecté !');
  socket.broadcast.emit('message', 'Un nouveau connecté');
});

server.listen(process.env.PORT || 8999, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});


app.get("/", (req, res) => {
  res.send({response: "I am alive"}).status(200);
});
