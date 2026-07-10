import express from "express";
import { DashboardRouteDeps } from "./types";

export const registerLibraryRoutes = (
  app: express.Express,
  deps: DashboardRouteDeps
) => {
  const { prisma, requireAuth, asyncHandler, parseJsonField } = deps;

  app.get("/library", requireAuth, asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const libraryId = `user_${req.user.id}`;
    const library = await prisma.library.findUnique({ where: { id: libraryId } });
    if (!library) return res.json({ items: [] });

    return res.json({ items: parseJsonField(library.items, []) });
  }));

  app.put("/library", requireAuth, asyncHandler(async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Items must be an array" });
    }

    if (items.length > 10000) {
      return res.status(400).json({ error: "Library items limit exceeded (max 10,000)" });
    }

    const serialized = JSON.stringify(items);
    if (serialized.length > 50 * 1024 * 1024) {
      return res.status(400).json({ error: "Library data too large" });
    }

    const libraryId = `user_${req.user.id}`;
    const library = await prisma.library.upsert({
      where: { id: libraryId },
      update: { items: serialized },
      create: { id: libraryId, items: serialized },
    });

    return res.json({ items: parseJsonField(library.items, []) });
  }));
};
