-- Criar enum UserRole se não existir
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EMPLOYEE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela User se não existir
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Criar unique constraint para email se não existir
DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_email_key" UNIQUE ("email");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;

-- Criar tabela Product se não existir
CREATE TABLE IF NOT EXISTS "Product" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "subname" TEXT,
  "description" TEXT,
  "brand" TEXT,
  "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "superWholesalePrice" DECIMAL(10,2),
  "superWholesaleQuantity" INTEGER,
  "cost" DECIMAL(10,2),
  "categoryId" TEXT NOT NULL,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isModalProduct" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- Criar FK constraint para categoryId se não existir
DO $$ BEGIN
  ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela ProductImage se não existir
CREATE TABLE IF NOT EXISTS "ProductImage" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "fileName" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "isMain" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- Criar FK constraint para ProductImage se não existir
DO $$ BEGIN
  ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela Supplier se não existir
CREATE TABLE IF NOT EXISTS "Supplier" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "email" TEXT,
  "notes" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- Criar tabela ProductSupplier se não existir
CREATE TABLE IF NOT EXISTS "ProductSupplier" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductSupplier_pkey" PRIMARY KEY ("id")
);

-- Criar FK constraints para ProductSupplier se não existir
DO $$ BEGIN
  ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProductSupplier" ADD CONSTRAINT "ProductSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela ProductModel se não existir
CREATE TABLE IF NOT EXISTS "ProductModel" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "modelId" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "superWholesalePrice" DECIMAL(10,2),
  "cost" DECIMAL(10,2),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductModel_pkey" PRIMARY KEY ("id")
);

-- Criar FK constraints para ProductModel se não existir
DO $$ BEGIN
  ALTER TABLE "ProductModel" ADD CONSTRAINT "ProductModel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ProductModel" ADD CONSTRAINT "ProductModel_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela ShippingCompany se não existir
CREATE TABLE IF NOT EXISTS "ShippingCompany" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "logo" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShippingCompany_pkey" PRIMARY KEY ("id")
);

-- Criar unique constraint para ShippingCompany name se não existir
DO $$ BEGIN
  ALTER TABLE "ShippingCompany" ADD CONSTRAINT "ShippingCompany_name_key" UNIQUE ("name");
EXCEPTION
  WHEN duplicate_table THEN null;
END $$;