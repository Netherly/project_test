-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "status" VARCHAR(50),
    "full_name" VARCHAR(255),
    "phone" VARCHAR(50),
    "email" VARCHAR(100),
    "login" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "folder" VARCHAR(255),

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "client_name" VARCHAR(255),
    "messenger_name" VARCHAR(100),
    "short_description" TEXT,
    "notes" TEXT,
    "category" VARCHAR(100),
    "source" VARCHAR(100),
    "full_name" VARCHAR(255),
    "phone" VARCHAR(50),
    "email" VARCHAR(100),
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "currency" VARCHAR(10),
    "payment_details" TEXT,
    "hourly_rate" DOUBLE PRECISION,
    "percent" DOUBLE PRECISION,
    "share_info" TEXT,
    "referrer" TEXT,
    "referrer_id" INTEGER,
    "referrer_first" TEXT,
    "referrer_first_id" INTEGER,
    "chat_link" TEXT,
    "photo_link" TEXT,
    "folder_link" TEXT,
    "manager_id" INTEGER,
    "company_id" INTEGER,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "description" TEXT,
    "clientId" INTEGER,
    "companyId" INTEGER,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "companyId" INTEGER,
    "country" VARCHAR(100),
    "category" VARCHAR(100),
    "source" VARCHAR(100),
    "referer" VARCHAR(255),
    "refererFirst" VARCHAR(255),
    "managerName" VARCHAR(255),
    "firstOrder" BOOLEAN DEFAULT false,
    "partnerName" VARCHAR(255),
    "partnerDisabled" BOOLEAN DEFAULT false,
    "partnerPayment" DECIMAL(10,2),
    "partnerPlan" INTEGER,
    "partnerPlanPercent" INTEGER,
    "partnerPlanSum" INTEGER,
    "partnerDebt" DECIMAL(10,2),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_login_key" ON "Employee"("login");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
