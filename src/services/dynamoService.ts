import { config, DynamoDB } from 'aws-sdk';
import { TableName } from '../types';
import { v4 as uuidv4 } from 'uuid';

export default class DynamoService {
  dynamoClient: DynamoDB.DocumentClient;

  constructor() {
    this.dbSetup();
  }

  private dbSetup() {
    config.update({
      region: process.env.POOL_REGION,
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY,
    });

    this.dynamoClient = new DynamoDB.DocumentClient();
  }

  getOffices = async () => await this.dynamoClient.scan({ TableName: TableName.OFFICES }).promise();
}
