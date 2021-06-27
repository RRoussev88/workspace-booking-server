import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import App from './app';
import AuthController from './controllers/authController';
import HomeController from './controllers/homeController';
import ProtectedController from './controllers/protectedController';
import OfficesController from './controllers/officesController';

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const app = new App({
  port: 8000,
  controllers: [new HomeController(), new AuthController(), new ProtectedController(), new OfficesController()],
  middlewares: [cors(), express.json(), express.urlencoded({ extended: true })],
});

app.listen();
