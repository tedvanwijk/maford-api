-- AlterTable
ALTER TABLE "series" ADD COLUMN     "tool_id" INTEGER;

-- CreateTable
CREATE TABLE "tools" (
    "tool_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categories" TEXT[],
    "inputs" TEXT[],

    CONSTRAINT "tools_pkey" PRIMARY KEY ("tool_id")
);

-- CreateTable
CREATE TABLE "tool_inputs" (
    "tool_input_id" SERIAL NOT NULL,
    "client_name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "property_name" TEXT NOT NULL,

    CONSTRAINT "tool_inputs_pkey" PRIMARY KEY ("tool_input_id")
);

-- CreateTable
CREATE TABLE "version_history" (
    "version_id" SERIAL NOT NULL,
    "version_number" TEXT NOT NULL,
    "changelog" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,

    CONSTRAINT "version_history_pkey" PRIMARY KEY ("version_id")
);

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "fk_tool_id" FOREIGN KEY ("tool_id") REFERENCES "tools"("tool_id") ON DELETE CASCADE ON UPDATE NO ACTION;
