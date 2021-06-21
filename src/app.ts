import express, { Application } from 'express';

export default class App {
  public app: Application;
  public port: number;

  constructor(appInit: { port: number; controllers: any; middlewares: any }) {
    this.app = express();
    this.port = appInit.port;

    this.middlewares(appInit.middlewares);
    this.routes(appInit.controllers);
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`App has started on port ${this.port}`);
    });
  }

  private routes(controllers: any[]) {
    controllers.forEach((controller) => {
      this.app.use(controller.path, controller.router);
    });
  }

  private middlewares(middlewares: any[]) {
    middlewares.forEach((middleware) => {
      this.app.use(middleware);
    });
  }
}
