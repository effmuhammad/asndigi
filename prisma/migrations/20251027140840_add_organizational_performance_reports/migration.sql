-- CreateEnum
CREATE TYPE "OrganizationalPredicate" AS ENUM ('SANGAT_BAIK', 'BAIK', 'CUKUP', 'KURANG');

-- CreateTable
CREATE TABLE "organizational_performance_reports" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "total_employees" INTEGER NOT NULL,
    "average_attendance_rate" DECIMAL(5,2) NOT NULL,
    "average_skp_progress" DECIMAL(5,2) NOT NULL,
    "overall_performance_score" DECIMAL(5,2) NOT NULL,
    "predicate" "OrganizationalPredicate" NOT NULL,
    "summary" TEXT,
    "recommendations" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "organizational_performance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizational_performance_reports_year_idx" ON "organizational_performance_reports"("year");

-- CreateIndex
CREATE INDEX "organizational_performance_reports_predicate_idx" ON "organizational_performance_reports"("predicate");

-- CreateIndex
CREATE UNIQUE INDEX "organizational_performance_reports_year_key" ON "organizational_performance_reports"("year");

-- AddForeignKey
ALTER TABLE "organizational_performance_reports" ADD CONSTRAINT "organizational_performance_reports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
