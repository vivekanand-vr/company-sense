-- AlterTable
ALTER TABLE `companies` ADD COLUMN `alexaRanking` INTEGER NULL,
    ADD COLUMN `angellistUrl` VARCHAR(191) NULL,
    ADD COLUMN `annualRevenueFormatted` VARCHAR(191) NULL,
    ADD COLUMN `blogUrl` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `competitiveAdvantage` VARCHAR(191) NULL,
    ADD COLUMN `country` VARCHAR(191) NULL,
    ADD COLUMN `currentTechnologies` JSON NULL,
    ADD COLUMN `departmentHeadcount` JSON NULL,
    ADD COLUMN `fundingEvents` JSON NULL,
    ADD COLUMN `googleSearchData` JSON NULL,
    ADD COLUMN `industries` JSON NULL,
    ADD COLUMN `keywords` JSON NULL,
    ADD COLUMN `latestFundingDate` DATETIME(3) NULL,
    ADD COLUMN `latestFundingStage` VARCHAR(191) NULL,
    ADD COLUMN `linkedinUid` VARCHAR(191) NULL,
    ADD COLUMN `logoUrl` VARCHAR(191) NULL,
    ADD COLUMN `marketPosition` VARCHAR(191) NULL,
    ADD COLUMN `orgChartData` JSON NULL,
    ADD COLUMN `postalCode` VARCHAR(191) NULL,
    ADD COLUMN `primaryDomain` VARCHAR(191) NULL,
    ADD COLUMN `primaryPhone` JSON NULL,
    ADD COLUMN `rawAddress` VARCHAR(191) NULL,
    ADD COLUMN `retailLocationCount` INTEGER NULL DEFAULT 0,
    ADD COLUMN `secondaryIndustries` JSON NULL,
    ADD COLUMN `seoDescription` TEXT NULL,
    ADD COLUMN `shortDescription` TEXT NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `stockExchange` VARCHAR(191) NULL,
    ADD COLUMN `streetAddress` VARCHAR(191) NULL,
    ADD COLUMN `summary` TEXT NULL,
    ADD COLUMN `technologies` JSON NULL,
    ADD COLUMN `totalFunding` DECIMAL(15, 2) NULL,
    ADD COLUMN `totalFundingFormatted` VARCHAR(191) NULL,
    MODIFY `dataSource` VARCHAR(191) NOT NULL DEFAULT 'google_apollo';

-- CreateIndex
CREATE INDEX `companies_primaryDomain_idx` ON `companies`(`primaryDomain`);

-- CreateIndex
CREATE INDEX `companies_apolloId_idx` ON `companies`(`apolloId`);

-- CreateIndex
CREATE INDEX `companies_foundedYear_idx` ON `companies`(`foundedYear`);

-- CreateIndex
CREATE INDEX `companies_publiclyTraded_idx` ON `companies`(`publiclyTraded`);
