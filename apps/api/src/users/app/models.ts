// User creation data
export type CreateUser = {
    name: string;
    surname: string;
    email: string;
    password: string;
};

// User login data
export type Login = {
    email: string;
    password: string;
};

// Authentication token response
export type AuthToken = {
    accessToken: string;
};

// User entity (without password)
export type User = {
    id: string; // UUID string
    name: string;
    surname: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
};

// Password hash with salt
export type PasswordHashWithSalt = {
    hash: string;
    salt: string;
};
