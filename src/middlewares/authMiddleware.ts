import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import fetch from 'node-fetch';

const pems = {};

export default class AuthMiddleware {
  private poolRegion = 'eu-central-1';
  private userPoolId = 'eu-central-1_SoSU9O17f';

  constructor() {
    this.setup();
  }

  verifyToken(req: Request, res: Response, next: Function) {
    const token = req.header('Authorization')?.split(' ')?.[1];
    if (!token) res.status(401).end();

    const decodedJwt = jwt.decode(token, { complete: true });
    if (!decodedJwt) res.status(401).end();

    const kid = decodedJwt.header.kid;
    if (!pems[kid]) res.status(401).end();

    jwt.verify(token, pems[kid], (err) => {
      if (err) res.status(401).end();
      next();
    });
  }

  private async setup() {
    const url = `https://cognito-idp.${this.poolRegion}.amazonaws.com/${this.userPoolId}/.well-known/jwks.json`;

    try {
      const response = await fetch(url);
      if (response.status !== 200) {
        throw 'Request not successful';
      }

      const data = await response.json();
      data.keys.forEach((key) => {
        pems[key.kid] = jwkToPem({ kty: key.kty, n: key.n, e: key.e });
      });
    } catch (error) {
      console.log('Error fetching jwk: ', error);
    }
  }
}
