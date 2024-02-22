-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "admin" BOOLEAN NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "series" (
    "series_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "flute_count" INTEGER NOT NULL,
    "helix_angle" INTEGER NOT NULL,
    "tolerance_file_name" TEXT NOT NULL,
    "tolerance_file_inputs" TEXT[],
    "tolerance_file_output_range" TEXT NOT NULL,
    "tolerance_file_input_range" TEXT NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("series_id")
);
