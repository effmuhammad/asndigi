/*
  Warnings:

  - You are about to drop the `skp_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `skp_realizations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."skp_items" DROP CONSTRAINT "skp_items_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."skp_realizations" DROP CONSTRAINT "skp_realizations_skp_item_id_fkey";

-- DropTable
DROP TABLE "public"."skp_items";

-- DropTable
DROP TABLE "public"."skp_realizations";
