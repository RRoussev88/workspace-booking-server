import express from 'express';
import cors from 'cors';
import App from './app';
import HomeController from './controllers/homeController';
import AuthController from './controllers/authController';
import ProtectedController from './controllers/protectedController';

const app = new App({
  port: 8000,
  controllers: [new HomeController(), new AuthController(), new ProtectedController()],
  middlewares: [cors(), express.json(), express.urlencoded({ extended: true })],
});

app.listen();
