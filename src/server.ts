import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import App from './app';
import AuthController from './controllers/authController';
import OfficesController from './controllers/officesController';
import OpenOrgsController from './controllers/openOrgController';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const app = new App({
  port: 8000,
  controllers: [new AuthController(), new OfficesController(), new OpenOrgsController()],
  middlewares: [cors(), express.json(), express.urlencoded({ extended: true })],
});

app.listen();
