-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telegramId" TEXT,
    "morningBriefTime" TEXT NOT NULL DEFAULT '08:00',
    "eveningReviewTime" TEXT NOT NULL DEFAULT '20:00'
);
INSERT INTO "new_User" ("id", "password", "telegramId", "username") SELECT "id", "password", "telegramId", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
