-- CreateEnum
CREATE TYPE "SkType" AS ENUM ('PENGANGKATAN', 'MUTASI', 'PROMOSI', 'PEMBERHENTIAN');

-- CreateEnum
CREATE TYPE "TrainingCategory" AS ENUM ('TEKNIS', 'MANAJERIAL', 'SOSIAL_KULTURAL', 'FUNGSIONAL', 'KEPEMIMPINAN');

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT,
    "birth_place" TEXT,
    "birth_date" DATE,
    "gender" TEXT,
    "religion" TEXT,
    "marital_status" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "emergency_contact" TEXT,
    "emergency_phone" TEXT,
    "photo_url" TEXT,
    "education_level" TEXT,
    "education_institution" TEXT,
    "education_major" TEXT,
    "education_year" INTEGER,
    "employment_start_date" DATE,
    "years_of_service" INTEGER,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sk_history" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "sk_number" TEXT NOT NULL,
    "sk_type" "SkType" NOT NULL,
    "position" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "effective_date" DATE NOT NULL,
    "file_url" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sk_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_records" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "training_name" TEXT NOT NULL,
    "category" "TrainingCategory" NOT NULL,
    "organizer" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "duration_hours" INTEGER,
    "certificate_url" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "profiles_user_id_idx" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "sk_history_profile_id_idx" ON "sk_history"("profile_id");

-- CreateIndex
CREATE INDEX "sk_history_effective_date_idx" ON "sk_history"("effective_date");

-- CreateIndex
CREATE INDEX "training_records_profile_id_idx" ON "training_records"("profile_id");

-- CreateIndex
CREATE INDEX "training_records_start_date_idx" ON "training_records"("start_date");

-- CreateIndex
CREATE INDEX "training_records_category_idx" ON "training_records"("category");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sk_history" ADD CONSTRAINT "sk_history_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_records" ADD CONSTRAINT "training_records_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
