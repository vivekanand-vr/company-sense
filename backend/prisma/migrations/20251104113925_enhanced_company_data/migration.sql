-- AlterTable
ALTER TABLE `companies` ADD COLUMN `apolloSource` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `businessModel` VARCHAR(191) NULL,
    ADD COLUMN `ceo` VARCHAR(191) NULL,
    ADD COLUMN `chatgptSource` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `combinedSource` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `enrichmentScore` DECIMAL(3, 2) NULL,
    ADD COLUMN `keyProducts` JSON NULL,
    ADD COLUMN `lastEnriched` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `originalCurrency` VARCHAR(191) NULL,
    ADD COLUMN `parentCompany` VARCHAR(191) NULL,
    ADD COLUMN `publiclyTraded` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `revenueUSD` DECIMAL(15, 2) NULL,
    ADD COLUMN `stockSymbol` VARCHAR(191) NULL,
    ADD COLUMN `subsidiaries` JSON NULL;

-- CreateIndex
CREATE INDEX `companies_enrichmentScore_idx` ON `companies`(`enrichmentScore`);

-- CreateIndex
CREATE INDEX `companies_apolloSource_idx` ON `companies`(`apolloSource`);

-- CreateIndex
CREATE INDEX `companies_chatgptSource_idx` ON `companies`(`chatgptSource`);
