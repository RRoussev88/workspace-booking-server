import { CognitoIdentityServiceProvider, AWSError } from 'aws-sdk';
import crypto from 'crypto';

export default class CognitoService {
  private cognitoIdentity;

  constructor() {
    this.cognitoIdentity = new CognitoIdentityServiceProvider({ region: process.env.POOL_REGION });
  }

  async signUpUser(
    username: string,
    password: string,
    userAttr: CognitoIdentityServiceProvider.Types.AttributeListType,
  ): Promise<boolean> {
    const params: CognitoIdentityServiceProvider.Types.SignUpRequest = {
      ClientId: process.env.CUSTOMER_ID,
      Username: username,
      Password: password,
      SecretHash: this.generateHash(username),
      UserAttributes: userAttr,
    };

    try {
      const data = await this.cognitoIdentity.signUp(params).promise();
      console.log('sign up data: ', data);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async verifyAccount(username: string, code: string): Promise<boolean> {
    const params: CognitoIdentityServiceProvider.Types.ConfirmSignUpRequest = {
      ClientId: process.env.CUSTOMER_ID,
      Username: username,
      SecretHash: this.generateHash(username),
      ConfirmationCode: code,
    };

    try {
      const data = await this.cognitoIdentity.confirmSignUp(params).promise();
      console.log('verify data: ', data);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async signInUser(
    username: string,
    password: string,
  ): Promise<CognitoIdentityServiceProvider.Types.InitiateAuthResponse | AWSError> {
    const params: CognitoIdentityServiceProvider.Types.InitiateAuthRequest = {
      ClientId: process.env.CUSTOMER_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
        SECRET_HASH: this.generateHash(username),
      },
    };

    try {
      const data: CognitoIdentityServiceProvider.Types.InitiateAuthResponse = await this.cognitoIdentity
        .initiateAuth(params)
        .promise();
      return data;
    } catch (error) {
      return error;
    }
  }

  private generateHash = (username: string) =>
    crypto
      .createHmac('SHA256', process.env.SECRET_HASH)
      .update(username + process.env.CUSTOMER_ID)
      .digest('base64');
}
