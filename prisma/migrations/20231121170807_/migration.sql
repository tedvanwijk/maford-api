-- CreateTable
CREATE TABLE "specifications" (
    "specification_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "specifications_pkey" PRIMARY KEY ("specification_id")
);

-- AddForeignKey
ALTER TABLE "specifications" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
