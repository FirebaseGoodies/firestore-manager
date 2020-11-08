
export interface Authentication {
  enabled?: boolean,
  type: AuthenticationType,
  data: AuthenticationCredentials
}

export enum AuthenticationType {
  None = 'none',
  Anonymous = 'anonymous',
  EmailAndPassword = 'emailAndPassword',
  JWT = 'jwt'
}

export interface AuthenticationCredentials {
  email?: string,
  password?: string,
  token?: string
}

export const AuthenticationData: AuthenticationCredentials = {
  email: null,
  password: null,
  token: null
};
