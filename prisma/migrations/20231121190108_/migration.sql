-- CreateTable
CREATE TABLE "custom_params" (
    "param_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "custom_params_pkey" PRIMARY KEY ("param_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_params_title_key" ON "custom_params"("title");
