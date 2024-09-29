-- CreateTable
CREATE TABLE "center_types" (
    "center_type_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "a1" DOUBLE PRECISION NOT NULL,
    "d1_lower" DOUBLE PRECISION NOT NULL,
    "d1_upper" DOUBLE PRECISION NOT NULL,
    "a2_lower" DOUBLE PRECISION NOT NULL,
    "a2_upper" DOUBLE PRECISION NOT NULL,
    "d2_lower" DOUBLE PRECISION NOT NULL,
    "d2_upper" DOUBLE PRECISION NOT NULL,
    "w_lower" DOUBLE PRECISION NOT NULL,
    "w_upper" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "center_types_pkey" PRIMARY KEY ("center_type_id")
);
