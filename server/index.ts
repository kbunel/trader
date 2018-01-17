import 'dotenv/config';

import * as express from 'express';
import * as http from 'http';
import * as bodyParser from 'body-parser';
import * as apiResponse from 'express-api-response';
import * as cors from 'cors';

import Bot from './bot';
import Routes from './routes';

const app = express();
const server = http.createServer(app);

const bot = new Bot(server);
const routes = new Routes(bot);

app.use(cors());

app.use(bodyParser.json({
  limit: process.env.BODY_LIMIT
}));

app.use(bodyParser.urlencoded({
  extended: true
}));

routes.list().forEach((route: any): void => {
  const method: string = route.method === 'DEL' ? 'delete' : route.method.toLowerCase();

  route.handlers.map((handler: any[any]) => {
    if (typeof handler !== 'function') {
      throw new Error('handler must be a function');
    }
  });

  route.handlers.push(apiResponse);

  app[method](route.path, ...route.handlers);
});

server.listen(process.env.PORT || 8999, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});
