export enum AuthRoute {
  SIGNUP = 'signup',
  SIGNIN = 'signin',
  VERIFY = 'verify',
}

export enum TableName {
  OFFICES = 'offices',
  COWORKING_SPACES = 'coworking-spaces',
  COMPANIES = 'companies',
}

export enum OfficeType {
  SIMPLE = 'simple',
  NAMED = 'named',
  BLUEPRINT = 'blueprint',
}

export enum OrgType {
  OPEN = 'open', // Coworking space
  CLOSED = 'closed', // Company
}

export type CoworkerPayload = Partial<{
  coworkerId: string;
  coworkerName: string;
  authTime: number;
  issueTime: number;
  expTime: number;
  organisations: string[];
}>;

export type Office = {
  id: string;
  organisationId: string;
  type: OfficeType;
  name: string;
  address: string;
  contact: string[];
  description: string;
  image?: string;
  capacity: number;
  occupied: number;
  // meetingRooms: number;
  // relaxZones: number;
  // printers: number;
};

export type Organisation = {
  id: string;
  name: string;
  type: OrgType;
  description: string;
  contact: string[]; // Coworker ids
  participants: string[]; // Coworker ids
  offices: string[]; // Office ids
  image?: string;
};

export type Coworker = { id: string; email: string; name?: string; avatar?: string };
