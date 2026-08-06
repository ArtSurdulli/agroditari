-- AlterTable
ALTER TABLE "crops" ADD COLUMN     "created_by_id" UUID;

-- AddForeignKey
ALTER TABLE "crops" ADD CONSTRAINT "crops_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
