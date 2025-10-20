export type AuthConfig = {
  authSecret: string;
  refreshTokenTTL?: number;
  accessTokenTTL?: number;
  basicAuth: {
    username: string;
    password: string;
  };
  oAuth: {
    github: {
      clientId?: string;
      clientSecret?: string;
    };
  };
};
