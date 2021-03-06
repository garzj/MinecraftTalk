import * as cookieParser from 'cookie-parser';
import { Application } from 'express';

export function middleware(app: Application) {
  app.use(cookieParser(process.env.TOKEN_SECRET));
}
