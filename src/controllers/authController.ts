import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { CognitoIdentityServiceProvider, AWSError } from 'aws-sdk';
import jwt from 'jsonwebtoken';
import { AuthRoute, CoworkerPayload } from '../types';
import CognitoService from '../services/cognitoService';

export default class AuthController {
  path = '/auth';
  router = express.Router();

  constructor() {
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(`/${AuthRoute.SIGNUP}`, this.validateBody(AuthRoute.SIGNUP), this.signUp);
    this.router.post(`/${AuthRoute.SIGNIN}`, this.validateBody(AuthRoute.SIGNIN), this.signIn);
    this.router.post(`/${AuthRoute.VERIFY}`, this.validateBody(AuthRoute.VERIFY), this.verify);
  }

  signUp(req: Request, res: Response) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(422).json({ errors: result.array() });
    }
    console.log('signup body is valid');

    new CognitoService()
      .signUpUser(req.body.username, req.body.password, [{ Name: 'email', Value: req.body.email }])
      .then((isSuccessfull) => {
        if (isSuccessfull) {
          res.status(200).end();
        } else {
          res.status(500).end();
        }
      })
      .catch((err) => console.log('Auth Service sign up error: ', err));
  }

  signIn(req: Request, res: Response) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(422).json({ errors: result.array() });
    }

    new CognitoService()
      .signInUser(req.body.username, req.body.password)
      .then((result) => {
        if ((result as AWSError).code === 'NotAuthorizedException') {
          res
            .status(500)
            .json({ errors: ['Incorrect username or password'] })
            .end();
        } else {
          const token = (result as CognitoIdentityServiceProvider.Types.InitiateAuthResponse)
            .AuthenticationResult;
          const decodedJwt = jwt.decode(token.AccessToken, { complete: true });
          const payload: CoworkerPayload = {
            coworkerId: decodedJwt.payload?.sub,
            coworkerEmail: req.body.username,
            coworkerName: decodedJwt.payload?.username,
            authTime: decodedJwt.payload?.auth_time,
            issueTime: decodedJwt.payload?.iat,
            expTime: decodedJwt.payload?.exp,
            organisations: decodedJwt.payload?.['cognito:groups'],
          };
          res.status(200).json({ token, payload }).end();
        }
      })
      .catch((error: AWSError) => res.status(error.statusCode).json({ error }));
  }

  verify(req: Request, res: Response) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.status(422).json({ errors: result.array() });
    }
    console.log('verify body is valid');

    new CognitoService()
      .verifyAccount(req.body.username, req.body.code)
      .then((isSuccessfull) => {
        if (isSuccessfull) {
          res.status(200).end();
        } else {
          res.status(500).end();
        }
      })
      .catch((err) => console.log('Auth Service verify error: ', err));
  }

  private validateBody(type: AuthRoute) {
    switch (type) {
      case AuthRoute.SIGNUP:
        return [
          body('username').notEmpty().isLength({ min: 6 }),
          body('email').notEmpty().normalizeEmail().isEmail(),
          body('password').isString().isLength({ min: 8 }),
        ];
      case AuthRoute.SIGNIN:
        return [
          body('username').notEmpty().isLength({ min: 6 }),
          body('password').isString().isLength({ min: 8 }),
        ];
      case AuthRoute.VERIFY:
        return [
          body('username').notEmpty().isLength({ min: 6 }),
          body('code').isString().isLength({ min: 6, max: 6 }),
        ];
    }
  }
}
