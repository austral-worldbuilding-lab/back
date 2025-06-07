-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "dimensions" TEXT[] DEFAULT ARRAY['Recursos', 'Cultura', 'Infraestructura', 'Economía', 'Gobierno', 'Ecología']::TEXT[],
ADD COLUMN     "scales" TEXT[] DEFAULT ARRAY['Persona', 'Comunidad', 'Institución']::TEXT[];
