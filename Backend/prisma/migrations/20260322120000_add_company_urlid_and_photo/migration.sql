ALTER TABLE "Company"
ADD COLUMN "urlId" INTEGER,
ADD COLUMN "photo_link" TEXT;

CREATE SEQUENCE "Company_urlId_seq";

ALTER SEQUENCE "Company_urlId_seq" OWNED BY "Company"."urlId";

ALTER TABLE "Company"
ALTER COLUMN "urlId" SET DEFAULT nextval('"Company_urlId_seq"');

UPDATE "Company"
SET "urlId" = nextval('"Company_urlId_seq"')
WHERE "urlId" IS NULL;

SELECT setval(
  '"Company_urlId_seq"',
  COALESCE((SELECT MAX("urlId") FROM "Company"), 1),
  EXISTS(SELECT 1 FROM "Company")
);

ALTER TABLE "Company"
ALTER COLUMN "urlId" SET NOT NULL;

CREATE UNIQUE INDEX "Company_urlId_key" ON "Company"("urlId");
