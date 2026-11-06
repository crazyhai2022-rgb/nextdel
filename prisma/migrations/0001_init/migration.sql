-- CreateTable
CREATE TABLE `AdminUser` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `passwordHash` VARCHAR(100) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'SUPPORT') NOT NULL DEFAULT 'ADMIN',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdminUser_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminSession` (
    `id` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(64) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(64) NULL,
    `userAgent` VARCHAR(255) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AdminSession_tokenHash_key`(`tokenHash`),
    INDEX `AdminSession_adminId_idx`(`adminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NULL,
    `action` VARCHAR(80) NOT NULL,
    `entity` VARCHAR(60) NULL,
    `entityId` VARCHAR(64) NULL,
    `details` JSON NULL,
    `ip` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    INDEX `AuditLog_entity_entityId_idx`(`entity`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `shortDescription` TEXT NULL,
    `description` LONGTEXT NULL,
    `overview` LONGTEXT NULL,
    `accessInstructions` LONGTEXT NULL,
    `originalPrice` INTEGER NOT NULL,
    `salePrice` INTEGER NOT NULL,
    `lifetimeLabel` VARCHAR(60) NULL DEFAULT 'Lifetime Access',
    `accessInfo` VARCHAR(200) NULL,
    `thumbnailUrl` VARCHAR(500) NULL,
    `thumbnailAlt` VARCHAR(200) NULL,
    `bannerUrl` VARCHAR(500) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'UNPUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `visible` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `demoEnabled` BOOLEAN NOT NULL DEFAULT false,
    `demoLinkType` VARCHAR(20) NOT NULL DEFAULT 'GROUP',
    `demoGroupUrl` VARCHAR(500) NULL,
    `demoChannelUrl` VARCHAR(500) NULL,
    `demoInviteUrl` VARCHAR(500) NULL,
    `demoButtonText` VARCHAR(60) NULL,
    `relatedMode` VARCHAR(10) NOT NULL DEFAULT 'AUTO',
    `seoTitle` VARCHAR(200) NULL,
    `seoDescription` TEXT NULL,
    `publishedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Product_slug_key`(`slug`),
    INDEX `Product_status_visible_deletedAt_idx`(`status`, `visible`, `deletedAt`),
    INDEX `Product_featured_idx`(`featured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductImage` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `alt` VARCHAR(200) NULL,
    `kind` VARCHAR(20) NOT NULL DEFAULT 'GALLERY',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `ProductImage_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductVideo` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(10) NOT NULL DEFAULT 'EMBED',
    `url` VARCHAR(500) NOT NULL,
    `title` VARCHAR(200) NULL,
    `posterUrl` VARCHAR(500) NULL,
    `isPreview` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `ProductVideo_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductFeature` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'FEATURE',
    `text` VARCHAR(500) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `ProductFeature_productId_type_idx`(`productId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductDownload` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `storageKey` VARCHAR(255) NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `size` INTEGER NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProductDownload_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductAccessLink` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(120) NOT NULL DEFAULT 'Access your product',
    `url` VARCHAR(1000) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `ProductAccessLink_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductFaq` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `question` VARCHAR(300) NOT NULL,
    `answer` TEXT NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `ProductFaq_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductRelation` (
    `fromId` VARCHAR(191) NOT NULL,
    `toId` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    INDEX `ProductRelation_toId_idx`(`toId`),
    PRIMARY KEY (`fromId`, `toId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Customer` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Customer_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` VARCHAR(191) NOT NULL,
    `orderNumber` VARCHAR(32) NOT NULL,
    `accessToken` VARCHAR(64) NOT NULL,
    `idempotencyKey` VARCHAR(64) NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(120) NOT NULL,
    `customerEmail` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(20) NULL,
    `subtotal` INTEGER NOT NULL,
    `discount` INTEGER NOT NULL,
    `total` INTEGER NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'INR',
    `gateway` VARCHAR(20) NULL,
    `gatewayMode` VARCHAR(10) NULL,
    `gatewayOrderId` VARCHAR(100) NULL,
    `gatewayData` JSON NULL,
    `transactionId` VARCHAR(100) NULL,
    `status` ENUM('PENDING', 'PAYMENT_INITIATED', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `deliveryStatus` ENUM('NOT_DELIVERED', 'DELIVERED', 'EMAIL_FAILED') NOT NULL DEFAULT 'NOT_DELIVERED',
    `failureReason` VARCHAR(500) NULL,
    `paidAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `firstAccessedAt` DATETIME(3) NULL,
    `refundedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `purchaseEventSentAt` DATETIME(3) NULL,
    `fbp` VARCHAR(255) NULL,
    `fbc` VARCHAR(255) NULL,
    `clientIp` VARCHAR(64) NULL,
    `userAgent` VARCHAR(255) NULL,
    `sourceUrl` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_orderNumber_key`(`orderNumber`),
    UNIQUE INDEX `Order_accessToken_key`(`accessToken`),
    UNIQUE INDEX `Order_idempotencyKey_key`(`idempotencyKey`),
    INDEX `Order_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `Order_customerEmail_idx`(`customerEmail`),
    INDEX `Order_gatewayOrderId_idx`(`gatewayOrderId`),
    INDEX `Order_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderItem` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NULL,
    `productTitle` VARCHAR(200) NOT NULL,
    `productSlug` VARCHAR(191) NOT NULL,
    `thumbnailUrl` VARCHAR(500) NULL,
    `unitOriginalPrice` INTEGER NOT NULL,
    `unitPrice` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,

    INDEX `OrderItem_orderId_idx`(`orderId`),
    INDEX `OrderItem_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `gateway` VARCHAR(20) NOT NULL,
    `gatewayPaymentId` VARCHAR(100) NOT NULL,
    `gatewayOrderId` VARCHAR(100) NULL,
    `amount` INTEGER NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'INR',
    `status` VARCHAR(30) NOT NULL,
    `method` VARCHAR(40) NULL,
    `verifiedVia` VARCHAR(20) NOT NULL,
    `raw` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Payment_orderId_idx`(`orderId`),
    UNIQUE INDEX `Payment_gateway_gatewayPaymentId_key`(`gateway`, `gatewayPaymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentWebhook` (
    `id` VARCHAR(191) NOT NULL,
    `gateway` VARCHAR(20) NOT NULL,
    `eventId` VARCHAR(100) NOT NULL,
    `eventType` VARCHAR(80) NULL,
    `signatureValid` BOOLEAN NOT NULL,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `orderNumber` VARCHAR(32) NULL,
    `error` TEXT NULL,
    `payload` LONGTEXT NOT NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PaymentWebhook_receivedAt_idx`(`receivedAt`),
    UNIQUE INDEX `PaymentWebhook_gateway_eventId_key`(`gateway`, `eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GatewayLog` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `gateway` VARCHAR(20) NOT NULL,
    `action` VARCHAR(60) NOT NULL,
    `success` BOOLEAN NOT NULL,
    `status` INTEGER NULL,
    `response` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `GatewayLog_orderId_idx`(`orderId`),
    INDEX `GatewayLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AbandonedCheckout` (
    `id` VARCHAR(191) NOT NULL,
    `visitorId` VARCHAR(64) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `name` VARCHAR(120) NULL,
    `email` VARCHAR(191) NULL,
    `cartSnapshot` JSON NULL,
    `amount` INTEGER NOT NULL DEFAULT 0,
    `stage` ENUM('CART', 'CHECKOUT_STARTED', 'DETAILS_ENTERED', 'ORDER_CREATED', 'PAYMENT_INITIATED', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'CART',
    `orderId` VARCHAR(191) NULL,
    `gateway` VARCHAR(20) NULL,
    `lastEvent` VARCHAR(60) NULL,
    `contactedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastActivityAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AbandonedCheckout_orderId_key`(`orderId`),
    INDEX `AbandonedCheckout_visitorId_idx`(`visitorId`),
    INDEX `AbandonedCheckout_stage_lastActivityAt_idx`(`stage`, `lastActivityAt`),
    INDEX `AbandonedCheckout_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DownloadLog` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `downloadId` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DownloadLog_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailLog` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NULL,
    `sentById` VARCHAR(191) NULL,
    `recipient` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(300) NOT NULL,
    `type` VARCHAR(40) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
    `messageId` VARCHAR(255) NULL,
    `error` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmailLog_recipient_idx`(`recipient`),
    INDEX `EmailLog_orderId_idx`(`orderId`),
    INDEX `EmailLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactInquiry` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(200) NULL,
    `orderNumber` VARCHAR(32) NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'NEW',
    `ip` VARCHAR(64) NULL,
    `repliedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContactInquiry_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `ContactInquiry_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Page` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `seoTitle` VARCHAR(200) NULL,
    `seoDescription` TEXT NULL,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Page_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteSetting` (
    `key` VARCHAR(64) NOT NULL,
    `value` LONGTEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentGatewaySetting` (
    `gateway` VARCHAR(20) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `mode` VARCHAR(10) NOT NULL DEFAULT 'TEST',
    `testPublicKey` VARCHAR(255) NULL,
    `testSecretEnc` TEXT NULL,
    `testWebhookSecretEnc` TEXT NULL,
    `livePublicKey` VARCHAR(255) NULL,
    `liveSecretEnc` TEXT NULL,
    `liveWebhookSecretEnc` TEXT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`gateway`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingSetting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `pixelEnabled` BOOLEAN NOT NULL DEFAULT false,
    `pixelId` VARCHAR(32) NULL,
    `capiEnabled` BOOLEAN NOT NULL DEFAULT false,
    `capiTokenEnc` TEXT NULL,
    `testEventCode` VARCHAR(40) NULL,
    `requireConsent` BOOLEAN NOT NULL DEFAULT true,
    `events` JSON NULL,
    `verificationStatus` VARCHAR(255) NULL,
    `lastVerifiedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialLink` (
    `id` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(30) NOT NULL,
    `label` VARCHAR(60) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AdminSession` ADD CONSTRAINT `AdminSession_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `AdminUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductVideo` ADD CONSTRAINT `ProductVideo_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductFeature` ADD CONSTRAINT `ProductFeature_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductDownload` ADD CONSTRAINT `ProductDownload_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductAccessLink` ADD CONSTRAINT `ProductAccessLink_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductFaq` ADD CONSTRAINT `ProductFaq_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductRelation` ADD CONSTRAINT `ProductRelation_fromId_fkey` FOREIGN KEY (`fromId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductRelation` ADD CONSTRAINT `ProductRelation_toId_fkey` FOREIGN KEY (`toId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GatewayLog` ADD CONSTRAINT `GatewayLog_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AbandonedCheckout` ADD CONSTRAINT `AbandonedCheckout_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AbandonedCheckout` ADD CONSTRAINT `AbandonedCheckout_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DownloadLog` ADD CONSTRAINT `DownloadLog_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DownloadLog` ADD CONSTRAINT `DownloadLog_downloadId_fkey` FOREIGN KEY (`downloadId`) REFERENCES `ProductDownload`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmailLog` ADD CONSTRAINT `EmailLog_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmailLog` ADD CONSTRAINT `EmailLog_sentById_fkey` FOREIGN KEY (`sentById`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

