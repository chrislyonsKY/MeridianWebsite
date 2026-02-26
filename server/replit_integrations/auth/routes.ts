import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import bcrypt from "bcrypt";
import crypto from "crypto";

export function registerAuthRoutes(app: Express): void {
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters." });
      }

      const existing = await authStorage.getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await authStorage.createUser({
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        authProvider: "email",
        onboardingCompleted: false,
      });

      (req.session as any).userId = user.id;

      const { passwordHash: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed. Please try again." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
      }

      const user = await authStorage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      (req.session as any).userId = user.id;

      const { passwordHash: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed." });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully." });
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      const { passwordHash: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user." });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required." });
      }

      const user = await authStorage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "If an account with that email exists, a reset link has been sent." });
      }

      await authStorage.deleteExpiredResetTokens(user.id);

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await authStorage.createResetToken(user.id, token, expiresAt);

      const resetUrl = `${req.protocol}://${req.get("host")}/auth/reset-password?token=${token}`;
      console.log(`[Auth] Password reset link for ${email}: ${resetUrl}`);

      res.json({ message: "If an account with that email exists, a reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request." });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required." });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters." });
      }

      const resetToken = await authStorage.getResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset link." });
      }

      if (new Date() > resetToken.expiresAt) {
        await authStorage.deleteResetToken(token);
        return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await authStorage.updateUser(resetToken.userId, { passwordHash });
      await authStorage.deleteResetToken(token);

      res.json({ message: "Password reset successfully." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password." });
    }
  });

  app.patch("/api/auth/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { topicPreferences, digestFrequency, onboardingCompleted } = req.body;

      const updates: any = {};
      if (topicPreferences !== undefined) updates.topicPreferences = topicPreferences;
      if (digestFrequency !== undefined) updates.digestFrequency = digestFrequency;
      if (onboardingCompleted !== undefined) updates.onboardingCompleted = onboardingCompleted;

      const user = await authStorage.updateUser(userId, updates);
      const { passwordHash: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Update preferences error:", error);
      res.status(500).json({ message: "Failed to update preferences." });
    }
  });
}
