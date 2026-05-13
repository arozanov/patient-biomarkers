-- CreateTable
CREATE TABLE "patients" (
    "id" SERIAL NOT NULL,
    "client_id" TEXT NOT NULL,
    "date_birthdate" DATE NOT NULL,
    "gender" INTEGER NOT NULL,
    "ethnicity" INTEGER NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_results" (
    "id" SERIAL NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "date_testing" DATE NOT NULL,
    "creatine" DECIMAL(10,4) NOT NULL,
    "creatine_unit" TEXT NOT NULL,
    "chloride" DECIMAL(10,4) NOT NULL,
    "chloride_unit" TEXT NOT NULL,
    "fasting_glucose" DECIMAL(10,4) NOT NULL,
    "fasting_glucose_unit" TEXT NOT NULL,
    "potassium" DECIMAL(10,4) NOT NULL,
    "potassium_unit" TEXT NOT NULL,
    "sodium" DECIMAL(10,4) NOT NULL,
    "sodium_unit" TEXT NOT NULL,
    "total_calcium" DECIMAL(10,4) NOT NULL,
    "total_calcium_unit" TEXT NOT NULL,
    "total_protein" DECIMAL(10,4) NOT NULL,
    "total_protein_unit" TEXT NOT NULL,

    CONSTRAINT "test_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_client_id_key" ON "patients"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "test_results_patient_id_date_testing_key" ON "test_results"("patient_id", "date_testing");

-- AddForeignKey
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
