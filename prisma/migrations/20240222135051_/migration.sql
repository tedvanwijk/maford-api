-- CreateTable
CREATE TABLE "reports" (
    "report_id" SERIAL NOT NULL,
    "specification_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "message" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("report_id")
);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "fk_specification_id" FOREIGN KEY ("specification_id") REFERENCES "specifications"("specification_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "fk_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;
