-- CreateEnum
CREATE TYPE "SkpMonthlyStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "skp_monthly_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "sequence_no" INTEGER NOT NULL DEFAULT 1,
    "indicator" TEXT NOT NULL,
    "action_plan" TEXT NOT NULL,
    "target_realization" TEXT NOT NULL,
    "supporting_data" TEXT,
    "feedback" TEXT,
    "status" "SkpMonthlyStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "supervisor_id" TEXT,

    CONSTRAINT "skp_monthly_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skp_monthly_files" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" TEXT,
    "file_size" INTEGER,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skp_monthly_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "skp_monthly_entries_user_id_idx" ON "skp_monthly_entries"("user_id");

-- CreateIndex
CREATE INDEX "skp_monthly_entries_year_month_idx" ON "skp_monthly_entries"("year", "month");

-- CreateIndex
CREATE INDEX "skp_monthly_entries_status_idx" ON "skp_monthly_entries"("status");

-- CreateIndex
CREATE INDEX "skp_monthly_entries_supervisor_id_idx" ON "skp_monthly_entries"("supervisor_id");

-- CreateIndex
CREATE UNIQUE INDEX "skp_monthly_entries_user_id_year_month_sequence_no_key" ON "skp_monthly_entries"("user_id", "year", "month", "sequence_no");

-- CreateIndex
CREATE INDEX "skp_monthly_files_entry_id_idx" ON "skp_monthly_files"("entry_id");

-- CreateIndex
CREATE INDEX "skp_monthly_files_uploaded_at_idx" ON "skp_monthly_files"("uploaded_at");

-- AddForeignKey
ALTER TABLE "skp_monthly_entries" ADD CONSTRAINT "skp_monthly_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skp_monthly_entries" ADD CONSTRAINT "skp_monthly_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skp_monthly_entries" ADD CONSTRAINT "skp_monthly_entries_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skp_monthly_files" ADD CONSTRAINT "skp_monthly_files_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "skp_monthly_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
