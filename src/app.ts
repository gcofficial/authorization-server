import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as mongodb from 'mongodb';
import { Router, Request, Response, NextFunction } from 'express';

import { RoutesService } from './services/routes.service';
import routes from './routes';

class App {
  public express: express.Application;
  public mongo_client: any;
  public db: any;

  constructor() {
    this.express = express();
    this.initMongo().middleware().routes();
  }

  private middleware() {
    // view engine setup
    this.express.set('views', path.join(path.dirname(__dirname), 'views'));
    this.express.set('view engine', 'twig');

    this.express.use(logger('dev'));
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({ extended: false }));
    this.express.use(express.static(path.join(__dirname, '../public')));
    return this;
  }

  initMongo() {
    this.mongo_client = mongodb.MongoClient;
    this.mongo_client.connect(
      'mongodb://localhost:27017/',
      (err, client) => {
        if (err) {
          console.log(err);
        }
        this.db = client.db('test_task');
      }
    )
    return this;
  }

  // Configure API endpoints.
  private routes(): void {
    this.express.use(cors());

    this.express.use('/', (new RoutesService(this, routes)).init());

    this.express.use(
      (req, res, next) => { 
        let err = new Error('Not Found');
        (<any>err).status = 404;
        next(err);
      }
    );
    this.express.use(
      (err, req, res, next) => { 
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render('error');
      }
    );
  }

}

export default new App().express;
