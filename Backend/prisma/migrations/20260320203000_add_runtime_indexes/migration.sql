CREATE INDEX IF NOT EXISTS "Employee_companyId_idx" ON "Employee"("companyId");
CREATE INDEX IF NOT EXISTS "Employee_roleId_idx" ON "Employee"("roleId");
CREATE INDEX IF NOT EXISTS "Employee_countryId_idx" ON "Employee"("countryId");
CREATE INDEX IF NOT EXISTS "Employee_currencyId_idx" ON "Employee"("currencyId");

CREATE INDEX IF NOT EXISTS "Client_groupId_idx" ON "Client"("groupId");
CREATE INDEX IF NOT EXISTS "Client_categoryId_idx" ON "Client"("categoryId");
CREATE INDEX IF NOT EXISTS "Client_sourceId_idx" ON "Client"("sourceId");
CREATE INDEX IF NOT EXISTS "Client_countryId_idx" ON "Client"("countryId");
CREATE INDEX IF NOT EXISTS "Client_currencyId_idx" ON "Client"("currencyId");
CREATE INDEX IF NOT EXISTS "Client_managerId_idx" ON "Client"("managerId");
CREATE INDEX IF NOT EXISTS "Client_companyId_idx" ON "Client"("companyId");

CREATE INDEX IF NOT EXISTS "orders_employeeId_idx" ON "orders"("employeeId");

CREATE INDEX IF NOT EXISTS "Task_employeeId_idx" ON "Task"("employeeId");
CREATE INDEX IF NOT EXISTS "Task_clientId_idx" ON "Task"("clientId");
CREATE INDEX IF NOT EXISTS "Task_companyId_idx" ON "Task"("companyId");

CREATE INDEX IF NOT EXISTS "Transaction_orderId_idx" ON "Transaction"("orderId");

CREATE INDEX IF NOT EXISTS "RegularPayment_categoryId_idx" ON "RegularPayment"("categoryId");
CREATE INDEX IF NOT EXISTS "RegularPayment_subcategoryId_idx" ON "RegularPayment"("subcategoryId");
CREATE INDEX IF NOT EXISTS "RegularPayment_orderId_idx" ON "RegularPayment"("orderId");

CREATE INDEX IF NOT EXISTS "Asset_typeId_idx" ON "Asset"("typeId");
CREATE INDEX IF NOT EXISTS "Asset_paymentSystemId_idx" ON "Asset"("paymentSystemId");
CREATE INDEX IF NOT EXISTS "Asset_cardDesignId_idx" ON "Asset"("cardDesignId");
