/* eslint-disable node/no-process-env */
import type { FastifyInstance } from "fastify";

import oauth2Plugin from "@fastify/oauth2";
import fp from "fastify-plugin";

const GOOGLE_CONFIGURATION = {
    authorizeHost: "https://accounts.google.com",
    authorizePath: "/o/oauth2/v2/auth",
    tokenHost: "https://www.googleapis.com",
    tokenPath: "/oauth2/v4/token",
};

const MICROSOFT_CONFIGURATION = {
    authorizeHost: "https://login.microsoftonline.com",
    authorizePath: "/common/oauth2/v2.0/authorize",
    tokenHost: "https://login.microsoftonline.com",
    tokenPath: "/common/oauth2/v2.0/token",
};

/**
 * OAuth2 plugin for Fastify
 * Adds OAuth2 providers for Google and Microsoft
 */
export default fp(async (fastify: FastifyInstance) => {
    // Get environment variables for OAuth configuration
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    const microsoftClientId = process.env.MICROSOFT_CLIENT_ID;
    const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET;

    const baseUrl = process.env.API_BASE_URL || "http://localhost:3001";

    if (googleClientId && googleClientSecret) {
        fastify.register(oauth2Plugin, {
            name: "googleOAuth2",
            scope: ["profile", "email"],
            credentials: {
                client: {
                    id: googleClientId,
                    secret: googleClientSecret,
                },
                auth: GOOGLE_CONFIGURATION,
            },
            startRedirectPath: "/v1/auth/google",
            callbackUri: `${baseUrl}/v1/auth/google/callback`,
            // pkce: "S256", // Use PKCE for additional security
        });

        fastify.log.info("Google OAuth2 provider registered");
    }
    else {
        fastify.log.warn("Google OAuth2 provider not registered - missing client ID or secret");
    }

    if (microsoftClientId && microsoftClientSecret) {
        fastify.register(oauth2Plugin, {
            name: "microsoftOAuth2",
            scope: ["user.read", "offline_access"],
            credentials: {
                client: {
                    id: microsoftClientId,
                    secret: microsoftClientSecret,
                },
                auth: MICROSOFT_CONFIGURATION,
            },
            startRedirectPath: "/v1/auth/microsoft",
            callbackUri: `${baseUrl}/v1/auth/microsoft/callback`,
            // pkce: "S256", // Use PKCE for additional security
        });

        fastify.log.info("Microsoft OAuth2 provider registered");
    }
    else {
        fastify.log.warn("Microsoft OAuth2 provider not registered - missing client ID or secret");
    }
});
