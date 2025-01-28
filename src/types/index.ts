export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  birthTime?: string;
  birthLocation?: string;
  gender?: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  status: 'active' | 'inactive' | 'suspended';
  emailVerified: boolean;
  profileComplete: boolean;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
}