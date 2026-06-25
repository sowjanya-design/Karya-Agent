-- ============================================================
-- Karya one-shot setup: creates all tables + admin accounts.
-- Paste this whole file into phpMyAdmin -> (your DB) -> SQL -> Go.
-- Safe to re-run: tables use IF NOT EXISTS, admins use upsert.
-- ============================================================

CREATE TABLE IF NOT EXISTS `User` (
    `id` VARCHAR(191) NOT NULL,
    `uid` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `assignedClients` JSON NULL,
    `isBanned` BOOLEAN NOT NULL DEFAULT false,
    `isApproved` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `User_uid_key`(`uid`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Client` (
    `id` VARCHAR(191) NOT NULL,
    `uid` VARCHAR(191) NOT NULL,
    `assignedEmployeeId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'incomplete',
    `masterResumeStorageUrl` TEXT NULL,
    `applicationData` JSON NULL,
    `onboardingSkipped` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `Client_uid_key`(`uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ClientJob` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `appliedDate` VARCHAR(191) NULL,
    `jobUrl` TEXT NULL,
    `location` VARCHAR(191) NULL,
    `salary` VARCHAR(191) NULL,
    `tailoredResumeUrl` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ResumeHistory` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `resumeText` TEXT NOT NULL,
    `company` VARCHAR(191) NULL,
    `role` VARCHAR(191) NULL,
    `atsScore` DOUBLE NULL,
    `jobId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PreRegistration` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL,
    `generatedPassword` VARCHAR(191) NOT NULL,
    `uid` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `PreRegistration_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign key (ignore error if it already exists on re-run)
ALTER TABLE `ClientJob` ADD CONSTRAINT `ClientJob_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Admin accounts (passwords: AdminPassword123! for the two karya admins, Avinash@001 for the third)
INSERT INTO `User` (`id`,`uid`,`email`,`role`,`displayName`,`passwordHash`,`isApproved`,`isBanned`,`createdAt`)
VALUES
 (UUID(),'admin_01','karya.ai.admin@gmail.com','admin','Karya Admin','$2b$10$YwX.CmkGSqj34Mn/LeenZu.R49X/Z7iGDRcNsNvtz2388awRyokt6',true,false,NOW(3)),
 (UUID(),'admin_02','karya.secret.admin@gmail.com','admin','Karya Admin 2','$2b$10$YwX.CmkGSqj34Mn/LeenZu.R49X/Z7iGDRcNsNvtz2388awRyokt6',true,false,NOW(3)),
 (UUID(),'admin_03','avinashmurari3@gmail.com','admin','Karya Admin 3','$2b$10$J.GlfiKXGbOVYUvgHaf0k.3KjuCJrSd9HeKknh3iKXt.DWx/mNHCG',true,false,NOW(3))
ON DUPLICATE KEY UPDATE
 `passwordHash`=VALUES(`passwordHash`), `role`='admin', `isApproved`=true;
