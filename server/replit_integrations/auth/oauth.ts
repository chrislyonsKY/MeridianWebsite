import type { Express, Request, Response } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as GitHubStrategy } from "passport-github2";
import crypto from "crypto";
import { authStorage } from "./storage";

type OAuthProfile = {
  provider: string;
  providerId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
};

function extractProfile(provider: string, profile: any): OAuthProfile {
  const emails = profile.emails || [];
  const email = emails.length > 0 ? emails[0].value : null;
  const photos = profile.photos || [];
  const profileImageUrl = photos.length > 0 ? photos[0].value : null;

  let firstName = profile.name?.givenName || null;
  let lastName = profile.name?.familyName || null;

  if (!firstName && profile.displayName) {
    const parts = profile.displayName.split(" ");
    firstName = parts[0] || null;
    lastName = parts.slice(1).join(" ") || null;
  }

  return {
    provider,
    providerId: profile.id,
    email,
    firstName,
    lastName,
    profileImageUrl,
  };
}

async function handleOAuthCallback(oauthProfile: OAuthProfile): Promise<string> {
  let user = await authStorage.getUserByOAuthProvider(oauthProfile.provider, oauthProfile.providerId);

  if (user) {
    await authStorage.updateUser(user.id, {
      profileImageUrl: oauthProfile.profileImageUrl || user.profileImageUrl,
      firstName: oauthProfile.firstName || user.firstName,
      lastName: oauthProfile.lastName || user.lastName,
    });
    return user.id;
  }

  if (oauthProfile.email) {
    const existingUser = await authStorage.getUserByEmail(oauthProfile.email);
    if (existingUser) {
      if (existingUser.passwordHash && existingUser.authProvider === "email") {
        return existingUser.id;
      }
      if (!existingUser.oauthProviderId) {
        await authStorage.updateUser(existingUser.id, {
          authProvider: oauthProfile.provider,
          oauthProviderId: oauthProfile.providerId,
          profileImageUrl: oauthProfile.profileImageUrl || existingUser.profileImageUrl,
        });
      }
      return existingUser.id;
    }
  }

  const newUser = await authStorage.createUser({
    email: oauthProfile.email,
    firstName: oauthProfile.firstName,
    lastName: oauthProfile.lastName,
    profileImageUrl: oauthProfile.profileImageUrl,
    authProvider: oauthProfile.provider,
    oauthProviderId: oauthProfile.providerId,
    passwordHash: null,
    onboardingCompleted: false,
  });

  return newUser.id;
}

function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

function setOAuthState(req: Request, state: string): void {
  (req.session as any).oauthState = state;
}

function verifyOAuthState(req: Request, state: string | undefined): boolean {
  const stored = (req.session as any).oauthState;
  if (!stored || !state || stored !== state) return false;
  delete (req.session as any).oauthState;
  return true;
}

function getCallbackUrl(req: Request, provider: string): string {
  const protocol = req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}/api/auth/${provider}/callback`;
}

function regenerateSession(req: Request, userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const sessionData = { ...(req.session as any) };
    delete sessionData.oauthState;
    req.session.regenerate((err) => {
      if (err) {
        (req.session as any).userId = userId;
        req.session.save(() => resolve());
        return;
      }
      (req.session as any).userId = userId;
      req.session.save((saveErr) => {
        if (saveErr) reject(saveErr);
        else resolve();
      });
    });
  });
}

export function setupOAuth(app: Express): void {
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await authStorage.getUser(id);
      done(null, user || null);
    } catch (err) {
      done(err, null);
    }
  });

  app.use(passport.initialize());

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      proxy: true,
      passReqToCallback: true,
    } as any, async (req: any, _accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        const state = req.query?.state;
        if (!verifyOAuthState(req, state)) {
          return done(new Error("Invalid OAuth state"), undefined);
        }
        const oauthProfile = extractProfile("google", profile);
        const userId = await handleOAuthCallback(oauthProfile);
        done(null, { id: userId });
      } catch (err) {
        done(err as Error, undefined);
      }
    }));

    app.get("/api/auth/google", (req, res, next) => {
      const state = generateState();
      setOAuthState(req, state);
      req.session.save(() => {
        passport.authenticate("google", {
          scope: ["profile", "email"],
          session: false,
          state,
        })(req, res, next);
      });
    });

    app.get("/api/auth/google/callback",
      passport.authenticate("google", { session: false, failureRedirect: "/auth/error?provider=google" }),
      oauthSuccessHandler
    );
  }

  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/api/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "picture.type(large)"],
      proxy: true,
      enableProof: true,
      passReqToCallback: true,
    } as any, async (req: any, _accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        const state = req.query?.state;
        if (!verifyOAuthState(req, state)) {
          return done(new Error("Invalid OAuth state"), undefined);
        }
        const oauthProfile = extractProfile("facebook", profile);
        done(null, { id: await handleOAuthCallback(oauthProfile) });
      } catch (err) {
        done(err as Error, undefined);
      }
    }));

    app.get("/api/auth/facebook", (req, res, next) => {
      const state = generateState();
      setOAuthState(req, state);
      req.session.save(() => {
        passport.authenticate("facebook", {
          scope: ["email"],
          session: false,
          state,
        })(req, res, next);
      });
    });

    app.get("/api/auth/facebook/callback",
      passport.authenticate("facebook", { session: false, failureRedirect: "/auth/error?provider=facebook" }),
      oauthSuccessHandler
    );
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback",
      scope: ["user:email"],
      proxy: true,
      passReqToCallback: true,
    } as any, async (req: any, _accessToken: string, _refreshToken: string, profile: any, done: any) => {
      try {
        const state = req.query?.state;
        if (!verifyOAuthState(req, state)) {
          return done(new Error("Invalid OAuth state"), undefined);
        }
        const oauthProfile = extractProfile("github", profile);
        done(null, { id: await handleOAuthCallback(oauthProfile) });
      } catch (err) {
        done(err as Error, undefined);
      }
    }));

    app.get("/api/auth/github", (req, res, next) => {
      const state = generateState();
      setOAuthState(req, state);
      req.session.save(() => {
        passport.authenticate("github", {
          scope: ["user:email"],
          session: false,
          state,
        })(req, res, next);
      });
    });

    app.get("/api/auth/github/callback",
      passport.authenticate("github", { session: false, failureRedirect: "/auth/error?provider=github" }),
      oauthSuccessHandler
    );
  }

  setupMicrosoftOAuth(app);
  setupAppleOAuth(app);

  app.get("/api/auth/providers", (_req, res) => {
    const providers: string[] = [];
    if (process.env.GOOGLE_CLIENT_ID) providers.push("google");
    if (process.env.FACEBOOK_APP_ID) providers.push("facebook");
    if (process.env.GITHUB_CLIENT_ID) providers.push("github");
    if (process.env.MICROSOFT_CLIENT_ID) providers.push("microsoft");
    if (process.env.APPLE_CLIENT_ID) providers.push("apple");
    res.json({ providers });
  });
}

async function oauthSuccessHandler(req: Request, res: Response) {
  const user = req.user as { id: string };
  if (user && user.id) {
    try {
      await regenerateSession(req, user.id);
      res.redirect("/feed");
    } catch {
      res.redirect("/auth/error?reason=session_error");
    }
  } else {
    res.redirect("/auth/error?reason=no_user");
  }
}

function setupMicrosoftOAuth(app: Express) {
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) return;

  app.get("/api/auth/microsoft", (req: Request, res: Response) => {
    const state = generateState();
    setOAuthState(req, state);
    req.session.save(() => {
      const clientId = process.env.MICROSOFT_CLIENT_ID!;
      const redirectUri = getCallbackUrl(req, "microsoft");
      const scope = "openid profile email User.Read";
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_mode=query&state=${encodeURIComponent(state)}`;
      res.redirect(authUrl);
    });
  });

  app.get("/api/auth/microsoft/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      if (!code) return res.redirect("/auth/error?provider=microsoft");
      if (!verifyOAuthState(req, state as string | undefined)) {
        return res.redirect("/auth/error?provider=microsoft&reason=invalid_state");
      }

      const redirectUri = getCallbackUrl(req, "microsoft");
      const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          code: code as string,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          scope: "openid profile email User.Read",
        }),
      });

      const tokenData = await tokenRes.json() as any;
      if (!tokenData.access_token) return res.redirect("/auth/error?provider=microsoft");

      const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await profileRes.json() as any;

      const oauthProfile: OAuthProfile = {
        provider: "microsoft",
        providerId: profile.id,
        email: profile.mail || profile.userPrincipalName || null,
        firstName: profile.givenName || null,
        lastName: profile.surname || null,
        profileImageUrl: null,
      };

      const userId = await handleOAuthCallback(oauthProfile);
      await regenerateSession(req, userId);
      res.redirect("/feed");
    } catch (err) {
      console.error("[OAuth] Microsoft callback error:", err);
      res.redirect("/auth/error?provider=microsoft");
    }
  });
}

function setupAppleOAuth(app: Express) {
  if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_CLIENT_SECRET) return;

  app.get("/api/auth/apple", (req: Request, res: Response) => {
    const state = generateState();
    setOAuthState(req, state);
    req.session.save(() => {
      const clientId = process.env.APPLE_CLIENT_ID!;
      const redirectUri = getCallbackUrl(req, "apple");
      const scope = "name email";
      const authUrl = `https://appleid.apple.com/auth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&response_mode=form_post&state=${encodeURIComponent(state)}`;
      res.redirect(authUrl);
    });
  });

  app.post("/api/auth/apple/callback", async (req: Request, res: Response) => {
    try {
      const { code, id_token, user, state } = req.body;
      if (!code) return res.redirect("/auth/error?provider=apple");
      if (!verifyOAuthState(req, state)) {
        return res.redirect("/auth/error?provider=apple&reason=invalid_state");
      }

      const redirectUri = getCallbackUrl(req, "apple");
      const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.APPLE_CLIENT_ID!,
          client_secret: process.env.APPLE_CLIENT_SECRET!,
          code: code as string,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json() as any;
      const idToken = tokenData.id_token || id_token;
      if (!idToken) return res.redirect("/auth/error?provider=apple");

      const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString());

      let firstName: string | null = null;
      let lastName: string | null = null;
      if (user) {
        try {
          const userData = typeof user === "string" ? JSON.parse(user) : user;
          firstName = userData.name?.firstName || null;
          lastName = userData.name?.lastName || null;
        } catch {}
      }

      const oauthProfile: OAuthProfile = {
        provider: "apple",
        providerId: payload.sub,
        email: payload.email || null,
        firstName,
        lastName,
        profileImageUrl: null,
      };

      const userId = await handleOAuthCallback(oauthProfile);
      await regenerateSession(req, userId);
      res.redirect("/feed");
    } catch (err) {
      console.error("[OAuth] Apple callback error:", err);
      res.redirect("/auth/error?provider=apple");
    }
  });
}
