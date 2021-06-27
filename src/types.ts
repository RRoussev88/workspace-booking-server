export enum AuthRoute {
  SIGNUP = 'signup',
  SIGNIN = 'signin',
  VERIFY = 'verify',
}

export enum TableName {
  OFFICES = 'offices',
}

export type Office = {
  id: string;
  companyId: string;
  type: 'OfficeType';
  name: string;
  address: string;
  contact: 'Employee';
  description: string;
  image: string;
  capacity: number;
  occupied: number;
};
