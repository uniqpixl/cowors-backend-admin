export type UserSession = {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    createdAt: Date;
    updatedAt: Date;
  };
};
