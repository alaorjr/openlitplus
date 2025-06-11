export type User = {
  id: string;
  name: string | null;
  email: string;
  isAdmin: boolean;
  createdAt: string; // Assuming ISO date string
  updatedAt: string; // Assuming ISO date string
};
