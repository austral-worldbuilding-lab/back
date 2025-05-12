-- CreateTable
CREATE TABLE "Mandala" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "Mandala_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Mandala" ADD CONSTRAINT "Mandala_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
