import { Router, Request, Response, NextFunction } from 'express';
import { IRoute } from '../interfaces/iroute';

export class RoutesService{

  private router;

  constructor(private app: any, private routes: Array<IRoute>) {
    this.router = Router();
  }

  init() {
    this.routes.map(
      r => {
        this
          .router[ r.method ](
            r.path,
            (req: Request, res: Response, next: NextFunction) => {
              (new r.response_service(this.app, req, res, next)).launch();
            }
          );
        return r;
      }
    );
    return this.router;
  }
}