CREATE SEQUENCE IF NOT EXISTS "Employee_urlId_seq";
ALTER TABLE "Employee" ADD COLUMN "urlId" INTEGER;
ALTER SEQUENCE "Employee_urlId_seq" OWNED BY "Employee"."urlId";
ALTER TABLE "Employee" ALTER COLUMN "urlId" SET DEFAULT nextval('"Employee_urlId_seq"');
UPDATE "Employee" SET "urlId" = nextval('"Employee_urlId_seq"') WHERE "urlId" IS NULL;
SELECT setval(
  '"Employee_urlId_seq"',
  COALESCE((SELECT MAX("urlId") FROM "Employee"), 1),
  EXISTS (SELECT 1 FROM "Employee")
);
ALTER TABLE "Employee" ALTER COLUMN "urlId" SET NOT NULL;
CREATE UNIQUE INDEX "Employee_urlId_key" ON "Employee"("urlId");

CREATE SEQUENCE IF NOT EXISTS "Client_urlId_seq";
ALTER TABLE "Client" ADD COLUMN "urlId" INTEGER;
ALTER SEQUENCE "Client_urlId_seq" OWNED BY "Client"."urlId";
ALTER TABLE "Client" ALTER COLUMN "urlId" SET DEFAULT nextval('"Client_urlId_seq"');
UPDATE "Client" SET "urlId" = nextval('"Client_urlId_seq"') WHERE "urlId" IS NULL;
SELECT setval(
  '"Client_urlId_seq"',
  COALESCE((SELECT MAX("urlId") FROM "Client"), 1),
  EXISTS (SELECT 1 FROM "Client")
);
ALTER TABLE "Client" ALTER COLUMN "urlId" SET NOT NULL;
CREATE UNIQUE INDEX "Client_urlId_key" ON "Client"("urlId");

CREATE SEQUENCE IF NOT EXISTS "orders_urlId_seq";
ALTER TABLE "orders" ADD COLUMN "urlId" INTEGER;
ALTER SEQUENCE "orders_urlId_seq" OWNED BY "orders"."urlId";
ALTER TABLE "orders" ALTER COLUMN "urlId" SET DEFAULT nextval('"orders_urlId_seq"');
UPDATE "orders" SET "urlId" = nextval('"orders_urlId_seq"') WHERE "urlId" IS NULL;
SELECT setval(
  '"orders_urlId_seq"',
  COALESCE((SELECT MAX("urlId") FROM "orders"), 1),
  EXISTS (SELECT 1 FROM "orders")
);
ALTER TABLE "orders" ALTER COLUMN "urlId" SET NOT NULL;
CREATE UNIQUE INDEX "orders_urlId_key" ON "orders"("urlId");

CREATE SEQUENCE IF NOT EXISTS "Transaction_urlId_seq";
ALTER TABLE "Transaction" ADD COLUMN "urlId" INTEGER;
ALTER SEQUENCE "Transaction_urlId_seq" OWNED BY "Transaction"."urlId";
ALTER TABLE "Transaction" ALTER COLUMN "urlId" SET DEFAULT nextval('"Transaction_urlId_seq"');
UPDATE "Transaction" SET "urlId" = nextval('"Transaction_urlId_seq"') WHERE "urlId" IS NULL;
SELECT setval(
  '"Transaction_urlId_seq"',
  COALESCE((SELECT MAX("urlId") FROM "Transaction"), 1),
  EXISTS (SELECT 1 FROM "Transaction")
);
ALTER TABLE "Transaction" ALTER COLUMN "urlId" SET NOT NULL;
CREATE UNIQUE INDEX "Transaction_urlId_key" ON "Transaction"("urlId");

CREATE SEQUENCE IF NOT EXISTS "RegularPayment_urlId_seq";
ALTER TABLE "RegularPayment" ADD COLUMN "urlId" INTEGER;
ALTER SEQUENCE "RegularPayment_urlId_seq" OWNED BY "RegularPayment"."urlId";
ALTER TABLE "RegularPayment" ALTER COLUMN "urlId" SET DEFAULT nextval('"RegularPayment_urlId_seq"');
UPDATE "RegularPayment" SET "urlId" = nextval('"RegularPayment_urlId_seq"') WHERE "urlId" IS NULL;
SELECT setval(
  '"RegularPayment_urlId_seq"',
  COALESCE((SELECT MAX("urlId") FROM "RegularPayment"), 1),
  EXISTS (SELECT 1 FROM "RegularPayment")
);
ALTER TABLE "RegularPayment" ALTER COLUMN "urlId" SET NOT NULL;
CREATE UNIQUE INDEX "RegularPayment_urlId_key" ON "RegularPayment"("urlId");

CREATE SEQUENCE IF NOT EXISTS "Asset_urlId_seq";
ALTER TABLE "Asset" ADD COLUMN "urlId" INTEGER;
ALTER SEQUENCE "Asset_urlId_seq" OWNED BY "Asset"."urlId";
ALTER TABLE "Asset" ALTER COLUMN "urlId" SET DEFAULT nextval('"Asset_urlId_seq"');
UPDATE "Asset" SET "urlId" = nextval('"Asset_urlId_seq"') WHERE "urlId" IS NULL;
SELECT setval(
  '"Asset_urlId_seq"',
  COALESCE((SELECT MAX("urlId") FROM "Asset"), 1),
  EXISTS (SELECT 1 FROM "Asset")
);
ALTER TABLE "Asset" ALTER COLUMN "urlId" SET NOT NULL;
CREATE UNIQUE INDEX "Asset_urlId_key" ON "Asset"("urlId");
