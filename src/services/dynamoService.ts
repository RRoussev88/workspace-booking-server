import { config, DynamoDB } from 'aws-sdk';
import { TableName } from '../types';

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

  getDocuments = async (TableName: TableName) => await this.dynamoClient.scan({ TableName }).promise();

  getDocumentById = async (TableName: TableName, documentId: string) =>
    await this.dynamoClient.get({ TableName, Key: { id: documentId } }).promise();

  addDocument = async (TableName: TableName, document: DynamoDB.DocumentClient.PutItemInputAttributeMap) =>
    await this.dynamoClient.put({ TableName, Item: document }).promise();

  deleteDocument = async (TableName: TableName, documentId: string) =>
    await this.dynamoClient.delete({ TableName, Key: { id: documentId } }).promise();
}
