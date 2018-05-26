import { Router, Request, Response, NextFunction } from 'express';

export abstract class Route{
  constructor(
    protected app: any,
    protected req: Request, 
    protected res: Response, 
    protected next: NextFunction) {}

  abstract launch();
}