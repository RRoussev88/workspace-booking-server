export enum AuthRoute {
  SIGNUP = 'signup',
  SIGNIN = 'signin',
  VERIFY = 'verify',
}

export enum TableName {
  SIMPLE_OFFICES = 'simple-offices',
  COWORKING_SPACES = 'coworking-spaces',
  COMPANIES = 'companies',
  RESERVATIONS = 'reservations',
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
  coworkerEmail: string;
  coworkerName: string;
  authTime: number;
  issueTime: number;
  expTime: number;
  organisations: string[];
}>;

export type Office = {
  id: string;
  type: OfficeType;
  organizationId: string;
  organizationType: OrgType;
  name: string;
  address: string;
  contact: string[];
  description: string;
  capacity: number;
  occupied: number;
  image?: string;
  // meetingRooms: number;
  // relaxZones: number;
  // printers: number;
};

export type Organization = {
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

export interface Reservation {
  id: string;
  officeId: string;
  fromTime: number;
  toTime: number;
  user: string;
}

export interface NamedReservation extends Reservation {
  workspaceId: string;
}

