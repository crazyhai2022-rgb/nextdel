-- NEXTDEL database for Hostinger (import once in phpMyAdmin on an EMPTY database)
SET NAMES utf8mb4;
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


-- Default CMS pages (Privacy, Terms, Refund, About, Contact, FAQ)
/*M!999999\- enable the sandbox mode */ 
SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
INSERT IGNORE INTO `Page` (`id`, `slug`, `title`, `content`, `seoTitle`, `seoDescription`, `published`, `updatedAt`, `createdAt`) VALUES ('cmw52xsa90000itkee7jbo5wh','about-us','About Us','<p>NEXTDEL creates and curates downloadable digital learning resources — guides, courses and study materials — delivered instantly with lifetime access.</p><h2>What we do</h2><p>Every product is built to be practical and easy to follow. After purchase you receive immediate access by email and on your secure order page.</p><h2>Why NEXTDEL</h2><ul><li>Instant digital delivery</li><li>Lifetime access to your purchases</li><li>Secure payments through trusted Indian payment gateways</li><li>Responsive customer support</li></ul>',NULL,NULL,1,'2026-11-06 14:38:31.281','2026-11-06 14:38:31.281'),
('cmw52xsc20001itke27c5wy7n','contact-us','Contact Us','<p>Have a question about a product or an order? We\'re happy to help. Include your order ID for faster support.</p>',NULL,NULL,1,'2026-11-06 14:38:31.347','2026-11-06 14:38:31.347'),
('cmw52xsc70002itke0umgunud','faq','Frequently Asked Questions','<h3>How do I receive my product?</h3><p>Immediately after your payment is verified, we email you a link to your secure order page where you can download files and open your access links.</p><h3>I paid but didn\'t receive an email.</h3><p>Check your spam/promotions folder first. You can also use <a href=\"/order-lookup\">Order Lookup</a> to resend your access email instantly, or contact support with your order ID.</p><h3>Is my payment secure?</h3><p>Yes. Payments are processed by our payment partner (Razorpay or Cashfree). We never see or store your card, UPI PIN or banking details.</p><h3>How long do I have access?</h3><p>Products marked \"Lifetime Access\" remain available for as long as the product is offered on NEXTDEL.</p><h3>Can I get a refund?</h3><p>Please read our <a href=\"/refund-policy\">Refund Policy</a>.</p>',NULL,NULL,1,'2026-11-06 14:38:31.351','2026-11-06 14:38:31.351'),
('cmw52xscb0003itkeswfancbn','privacy-policy','Privacy Policy','<p class=\"note\"><em>Template — review and edit this page from Admin → Pages before going live. Have legal pages checked by a qualified professional.</em></p><p>This Privacy Policy explains how NEXTDEL (\"we\", \"us\") collects, uses and protects your information when you use our website and purchase our digital products.</p>\n<h2>1. Information we collect</h2><ul><li><strong>Details you provide:</strong> your name, email address and (where our payment partner requires it) mobile number when you check out or contact us.</li><li><strong>Order information:</strong> products purchased, amounts, order and transaction IDs, and payment status.</li><li><strong>Technical information:</strong> IP address, browser type, device information and pages visited, collected through cookies and similar technologies.</li></ul>\n<h2>2. Email information</h2><p>We use your email address to deliver your purchases, send order confirmations and receipts, respond to support requests and, where you started a checkout, occasionally follow up about an incomplete order. We do not sell your email address.</p>\n<h2>3. Payment processing</h2><p>Payments are processed by third-party payment gateways (Razorpay and/or Cashfree Payments). Your card, UPI and banking details are entered directly with the payment gateway and are never stored on our servers. Gateways process your data under their own privacy policies.</p>\n<h2>4. Cookies</h2><p>We use essential cookies/local storage to run the website (for example, to remember your cart). With your consent, we also use analytics and advertising cookies. You can accept or decline non-essential cookies through our cookie banner and can clear cookies in your browser at any time.</p>\n<h2>5. Analytics and Meta Pixel</h2><p>With your consent we use the Meta Pixel (and may use the Meta Conversions API) to measure the effectiveness of our advertising — for example, when a product is viewed, added to cart or purchased. Information shared with Meta may include hashed (encrypted) email addresses, order values, product identifiers, IP address and browser information.</p>\n<h2>6. Data storage and security</h2><p>Your data is stored on secure servers. We use encryption, access controls and other safeguards to protect it. We retain order records as long as needed to provide access to your purchases and to meet legal, tax and accounting obligations.</p>\n<h2>7. Third-party services</h2><p>We share data only with service providers that help us operate: payment gateways, email delivery providers, hosting providers and (with consent) Meta. Each processes data only for the services they provide to us.</p>\n<h2>8. Your rights</h2><p>Subject to applicable law, you may request access to, correction of or deletion of your personal data, and you may withdraw consent for marketing or tracking at any time. Some order information must be retained for legal reasons.</p>\n<h2>9. Contact</h2><p>For privacy questions or requests, contact us via the <a href=\"/contact-us\">Contact Us</a> page.</p>',NULL,NULL,1,'2026-11-06 14:38:31.355','2026-11-06 14:38:31.355'),
('cmw52xscd0004itke5qg0e5rb','terms-and-conditions','Terms and Conditions','<p class=\"note\"><em>Template — review and edit this page from Admin → Pages before going live. Have legal pages checked by a qualified professional.</em></p><p>By accessing this website or purchasing from NEXTDEL, you agree to these Terms and Conditions.</p>\n<h2>1. Eligibility</h2><p>Some products are intended only for adults. By purchasing, you confirm you are at least 18 years old (or the age of majority in your jurisdiction) and legally permitted to access the content.</p>\n<h2>2. Digital products and licence</h2><p>All products are digital. On purchase you receive a personal, non-transferable, non-exclusive licence to access and use the product for your own educational purposes. You may not resell, share, redistribute, publicly post or reproduce the content.</p>\n<h2>3. Pricing and payment</h2><p>Prices are shown in Indian Rupees (INR). Payment is processed securely by our payment partners. An order is confirmed only after payment is verified by the payment gateway.</p>\n<h2>4. Delivery</h2><p>Products are delivered digitally by email and through your secure order page after payment verification. Download links are time-limited for security; your order page always generates fresh links.</p>\n<h2>5. Refunds</h2><p>Refunds are governed by our <a href=\"/refund-policy\">Refund Policy</a>.</p>\n<h2>6. Intellectual property</h2><p>All content, trademarks and materials are owned by NEXTDEL or its licensors and are protected by law.</p>\n<h2>7. Limitation of liability</h2><p>Products are provided for educational purposes. To the extent permitted by law, NEXTDEL is not liable for indirect or consequential losses arising from use of the products.</p>\n<h2>8. Changes</h2><p>We may update these terms from time to time. The version published on this page applies to your purchase.</p>\n<h2>9. Governing law</h2><p>These terms are governed by the laws of India.</p>',NULL,NULL,1,'2026-11-06 14:38:31.357','2026-11-06 14:38:31.357'),
('cmw52xscf0005itkeorqzr0ag','refund-policy','Refund Policy','<p class=\"note\"><em>Template — review and edit this page from Admin → Pages before going live. Have legal pages checked by a qualified professional.</em></p><p>NEXTDEL sells downloadable digital products and digital access-based educational resources. Because digital products can be downloaded or accessed immediately after purchase, <strong>refunds and returns are generally not offered once an order has been successfully delivered or access has been provided.</strong></p>\n<h2>When we will help</h2><p>Nothing in this policy limits any rights or remedies you have under applicable consumer protection law. We will provide a remedy — such as re-delivery, a replacement or a refund — in situations including:</p><ul><li><strong>Duplicate charge:</strong> you were charged more than once for the same order.</li><li><strong>Unauthorised transaction:</strong> a payment was made without your permission.</li><li><strong>Non-delivery:</strong> you paid but did not receive access and we are unable to provide it.</li><li><strong>Technical failure:</strong> the file or access link is defective and we cannot fix it within a reasonable time.</li><li><strong>Other cases</strong> where a remedy is required by law.</li></ul>\n<h2>How to request help</h2><p>Contact us through the <a href=\"/contact-us\">Contact Us</a> page within 7 days of purchase with your order ID, the email used at checkout and a description of the issue. Approved refunds are processed to the original payment method; timelines depend on your bank and payment provider.</p>\n<h2>Failed or pending payments</h2><p>If money was debited but your order shows as failed, the amount is normally reversed automatically by your bank or payment provider within 5–7 working days. Contact us if it isn\'t.</p>',NULL,NULL,1,'2026-11-06 14:38:31.359','2026-11-06 14:38:31.359');
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
INSERT IGNORE INTO `PaymentGatewaySetting` (`gateway`,`enabled`,`mode`,`updatedAt`) VALUES ('RAZORPAY',0,'TEST',NOW(3)),('CASHFREE',0,'TEST',NOW(3));
INSERT IGNORE INTO `MarketingSetting` (`id`,`pixelEnabled`,`capiEnabled`,`requireConsent`,`updatedAt`) VALUES (1,0,0,1,NOW(3));
