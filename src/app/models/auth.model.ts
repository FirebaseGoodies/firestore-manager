
export interface Authentication {
  enabled?: boolean,
  type: AuthenticationType,
  data: any
}

export enum AuthenticationType {
  None = 'none',
  Anonymous = 'anonymous',
  EmailAndPassword = 'emailAndPassword',
  Token = 'token'
}

export const AuthenticationData: object = {
  email: null,
  password: null,
  token: null
};
