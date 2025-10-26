-- CreateTable
CREATE TABLE "work_settings" (
    "id" TEXT NOT NULL,
    "work_start_time" TEXT NOT NULL DEFAULT '08:00',
    "work_end_time" TEXT NOT NULL DEFAULT '17:00',
    "late_tolerance_minutes" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "work_settings_is_active_idx" ON "work_settings"("is_active");
