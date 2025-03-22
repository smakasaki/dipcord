import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";

import { UserErrorResponses, UserSchema } from "@dipcord/schema";
import { Type } from "@sinclair/typebox";

import { UnauthorizedException } from "#commons/app/exceptions.js";
import { mapUserToResponse } from "#users/infra/utils/user-mapper.js";

/**
 * OAuth routes for handling Google and Microsoft authentication
 */
const routes: FastifyPluginAsyncTypebox = async function (fastify): Promise<void> {
    /**
     * Google OAuth callback handler
     */
    fastify.get("/auth/google/callback", {
        config: {
            auth: false,
        },
        schema: {
            tags: ["Auth", "OAuth"],
            description: "Google OAuth callback endpoint",
            response: {
                200: UserSchema,
                ...UserErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            // Exchange the authorization code for an access token
            const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request, reply);

            // Request user profile information from Google
            const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: {
                    Authorization: `Bearer ${token.access_token}`,
                },
            });

            if (!userInfoResponse.ok) {
                throw new UnauthorizedException("Failed to fetch user profile from Google");
            }

            const googleProfile = await userInfoResponse.json();

            // Look for existing user with this email
            let user = await fastify.userService.findByEmail(googleProfile.email);

            // If no user exists with this email, create a new one
            if (!user) {
                user = await fastify.userService.create({
                    name: googleProfile.given_name || googleProfile.name || "Google",
                    surname: googleProfile.family_name || "User",
                    email: googleProfile.email,
                    username: `google-${googleProfile.sub}`,
                    // Generate a secure random password since we won't use it for OAuth users
                    password: crypto.randomUUID(),
                });
            }

            // Create a session for the user
            const { session } = await fastify.userService.createSession(user, request.ip, request.headers["user-agent"]);

            // Get cookie configuration from session service
            const { name, options } = fastify.sessionService.getCookieConfig();

            // Set session cookie
            reply.setCookie(name, session.token, options);

            // Return the user information
            return mapUserToResponse(user);
        }
        catch (error) {
            fastify.log.error(error, "Google OAuth authentication failed");
            throw new UnauthorizedException("Google authentication failed");
        }
    });

    /**
     * Microsoft OAuth callback handler
     */
    fastify.get("/auth/microsoft/callback", {
        config: {
            auth: false,
        },
        schema: {
            tags: ["Auth", "OAuth"],
            description: "Microsoft OAuth callback endpoint",
            response: {
                200: UserSchema,
                ...UserErrorResponses,
            },
        },
    }, async (request, reply) => {
        try {
            // Exchange the authorization code for an access token
            const { token } = await fastify.microsoftOAuth2.getAccessTokenFromAuthorizationCodeFlow(request, reply);

            // Request user profile information from Microsoft Graph API
            const userInfoResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
                headers: {
                    Authorization: `Bearer ${token.access_token}`,
                },
            });

            if (!userInfoResponse.ok) {
                throw new UnauthorizedException("Failed to fetch user profile from Microsoft");
            }

            const microsoftProfile = await userInfoResponse.json();

            // Look for existing user with this email
            let user = await fastify.userService.findByEmail(microsoftProfile.mail || microsoftProfile.userPrincipalName);

            // If no user exists with this email, create a new one
            if (!user) {
                user = await fastify.userService.create({
                    name: microsoftProfile.givenName || microsoftProfile.displayName || "Microsoft",
                    surname: microsoftProfile.surname || "User",
                    email: microsoftProfile.mail || microsoftProfile.userPrincipalName,
                    username: `microsoft-${microsoftProfile.id}`,
                    // Generate a secure random password since we won't use it for OAuth users
                    password: crypto.randomUUID(),
                });
            }

            // Create a session for the user
            const { session } = await fastify.userService.createSession(user, request.ip, request.headers["user-agent"]);

            // Get cookie configuration from session service
            const { name, options } = fastify.sessionService.getCookieConfig();

            // Set session cookie
            reply.setCookie(name, session.token, options);

            // Return the user information
            return mapUserToResponse(user);
        }
        catch (error) {
            fastify.log.error(error, "Microsoft OAuth authentication failed");
            throw new UnauthorizedException("Microsoft authentication failed");
        }
    });

    /**
     * OAuth status endpoint to check available providers
     */
    fastify.get("/auth/providers", {
        config: {
            auth: false,
        },
        schema: {
            tags: ["Auth", "OAuth"],
            description: "List available OAuth providers",
            response: {
                200: Type.Object({
                    providers: Type.Array(Type.Object({
                        name: Type.String(),
                        loginUrl: Type.String(),
                    })),
                }),
            },
        },
    }, async () => {
        const providers = [];

        if (fastify.googleOAuth2) {
            providers.push({
                name: "google",
                loginUrl: "/v1/auth/google",
            });
        }

        if (fastify.microsoftOAuth2) {
            providers.push({
                name: "microsoft",
                loginUrl: "/v1/auth/microsoft",
            });
        }

        return { providers };
    });
};

export default routes;
