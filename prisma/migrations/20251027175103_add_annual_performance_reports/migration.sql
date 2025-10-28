-- CreateEnum
CREATE TYPE "WorkResultRating" AS ENUM ('DIATAS_EKSPEKTASI', 'SESUAI_EKSPEKTASI', 'DIBAWAH_EKSPEKTASI');

-- CreateEnum
CREATE TYPE "BehaviorRating" AS ENUM ('DIATAS_EKSPEKTASI', 'SESUAI_EKSPEKTASI', 'DIBAWAH_EKSPEKTASI');

-- CreateEnum
CREATE TYPE "PerformancePredicate" AS ENUM ('SANGAT_BAIK', 'BAIK', 'KURANG');

-- CreateEnum
CREATE TYPE "DigitalSignatureStatus" AS ENUM ('PENDING', 'SIGNED', 'REJECTED');

-- CreateTable
CREATE TABLE "annual_performance_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "attendance_summary" JSONB NOT NULL DEFAULT '{}',
    "skp_summary" JSONB NOT NULL DEFAULT '{}',
    "work_result_rating" "WorkResultRating" NOT NULL,
    "behavior_rating" "BehaviorRating" NOT NULL,
    "performance_predicate" "PerformancePredicate" NOT NULL,
    "ai_generated_summary" TEXT,
    "self_assessment" TEXT,
    "achievements" TEXT,
    "challenges" TEXT,
    "improvement_plan" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annual_performance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisor_evaluations" (
    "id" TEXT NOT NULL,
    "annual_report_id" TEXT NOT NULL,
    "supervisor_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "work_quality_score" INTEGER NOT NULL,
    "work_quantity_score" INTEGER NOT NULL,
    "punctuality_score" INTEGER NOT NULL,
    "cooperation_score" INTEGER NOT NULL,
    "initiative_score" INTEGER NOT NULL,
    "leadership_score" INTEGER,
    "overall_rating" DECIMAL(3,2) NOT NULL,
    "supervisor_comments" TEXT,
    "recommendations" TEXT,
    "development_areas" TEXT,
    "strengths" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supervisor_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_signatures" (
    "id" TEXT NOT NULL,
    "annual_report_id" TEXT NOT NULL,
    "signer_id" TEXT NOT NULL,
    "signature_data" TEXT NOT NULL,
    "signature_timestamp" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "status" "DigitalSignatureStatus" NOT NULL DEFAULT 'PENDING',
    "verification_code" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "digital_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "annual_performance_reports_user_id_idx" ON "annual_performance_reports"("user_id");

-- CreateIndex
CREATE INDEX "annual_performance_reports_year_idx" ON "annual_performance_reports"("year");

-- CreateIndex
CREATE INDEX "annual_performance_reports_status_idx" ON "annual_performance_reports"("status");

-- CreateIndex
CREATE INDEX "annual_performance_reports_performance_predicate_idx" ON "annual_performance_reports"("performance_predicate");

-- CreateIndex
CREATE UNIQUE INDEX "annual_performance_reports_user_id_year_key" ON "annual_performance_reports"("user_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "supervisor_evaluations_annual_report_id_key" ON "supervisor_evaluations"("annual_report_id");

-- CreateIndex
CREATE INDEX "supervisor_evaluations_supervisor_id_idx" ON "supervisor_evaluations"("supervisor_id");

-- CreateIndex
CREATE INDEX "supervisor_evaluations_employee_id_idx" ON "supervisor_evaluations"("employee_id");

-- CreateIndex
CREATE INDEX "supervisor_evaluations_annual_report_id_idx" ON "supervisor_evaluations"("annual_report_id");

-- CreateIndex
CREATE UNIQUE INDEX "digital_signatures_annual_report_id_key" ON "digital_signatures"("annual_report_id");

-- CreateIndex
CREATE INDEX "digital_signatures_signer_id_idx" ON "digital_signatures"("signer_id");

-- CreateIndex
CREATE INDEX "digital_signatures_annual_report_id_idx" ON "digital_signatures"("annual_report_id");

-- CreateIndex
CREATE INDEX "digital_signatures_status_idx" ON "digital_signatures"("status");

-- CreateIndex
CREATE INDEX "digital_signatures_signature_timestamp_idx" ON "digital_signatures"("signature_timestamp");

-- AddForeignKey
ALTER TABLE "annual_performance_reports" ADD CONSTRAINT "annual_performance_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_evaluations" ADD CONSTRAINT "supervisor_evaluations_annual_report_id_fkey" FOREIGN KEY ("annual_report_id") REFERENCES "annual_performance_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_evaluations" ADD CONSTRAINT "supervisor_evaluations_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_evaluations" ADD CONSTRAINT "supervisor_evaluations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_signatures" ADD CONSTRAINT "digital_signatures_annual_report_id_fkey" FOREIGN KEY ("annual_report_id") REFERENCES "annual_performance_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_signatures" ADD CONSTRAINT "digital_signatures_signer_id_fkey" FOREIGN KEY ("signer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
