# Centro de Mandala - Nueva Funcionalidad

## Descripción

Se ha actualizado la estructura de la base de datos y la API para permitir que las mandalas puedan almacenar información del centro y su descripción enviada desde el frontend **dentro del JSON configuration**.

## Cambios Realizados

### 1. Base de Datos (Prisma Schema)
```sql
-- El campo configuration ahora incluye información del centro
configuration Json // Contains center, dimensions[] and scales[]
```

### 2. Estructura de Datos en JSON Configuration
```typescript
{
  center: {
    name: string,
    description: string,
    color: string
  },
  dimensions: {
    name: string,
    color: string
  }[],
  scales: string[],
  linkedTo: string // mandalaId del personaje padre
}
```

## Uso de la API

### Crear una Mandala con Centro

```json
POST /mandala
{
  "name": "Mandala del Sistema UA",
  "projectId": "e2e9e2d5-e3c7-47e4-9f12-4f6f40062eee",
  "center": {
    "name": "Universidad Austral",
    "description": "Una institución educativa de excelencia que forma líderes íntegros",
    "color": "#3B82F6"
  },
  "dimensions": [
    { "name": "Recursos", "color": "#FF0000" },
    { "name": "Cultura", "color": "#00FF00" },
    { "name": "Infraestructura", "color": "#0000FF" }
  ],
  "scales": ["Persona", "Comunidad", "Institución"],
  "linkedToId": null
}
```

### Respuesta de la API

```json
{
  "message": "Mandala created successfully",
  "data": {
    "id": "12345-67890-abcdef",
    "name": "Mandala del Sistema UA",
    "projectId": "e2e9e2d5-e3c7-47e4-9f12-4f6f40062eee",
    "center": {
      "name": "Universidad Austral",
      "description": "Una institución educativa de excelencia que forma líderes íntegros",
      "color": "#3B82F6"
    },
    "configuration": {
      "center": {
        "name": "Universidad Austral",
        "description": "Una institución educativa de excelencia que forma líderes íntegros",
        "color": "#3B82F6"
      },
      "dimensions": [
        { "name": "Recursos", "color": "#FF0000" },
        { "name": "Cultura", "color": "#00FF00" },
        { "name": "Infraestructura", "color": "#0000FF" }
      ],
      "scales": ["Persona", "Comunidad", "Institución"],
      "linkedTo": null
    },
    "linkedToId": null,
    "createdAt": "2024-06-08T18:30:00.000Z",
    "updatedAt": "2024-06-08T18:30:00.000Z"
  }
}
```

## Implementación Técnica

### Almacenamiento en JSON
- **Todos los datos del centro se almacenan únicamente en el JSON `configuration`**
- El campo `center` está disponible tanto en el nivel superior del DTO como dentro de `configuration`
- Esto mantiene consistencia y flexibilidad sin duplicación de datos

### Retrocompatibilidad
- Las mandalas existentes sin centro seguirán funcionando normalmente
- El campo `center` es opcional en la creación
- Si no se proporciona centro, se puede obtener de la configuración del proyecto

### Validaciones
- El centro es completamente opcional
- Si se proporciona, `name` y `color` son requeridos
- `description` es opcional

## Migraciones Aplicadas

```sql
-- Migration: 20250608183628_remove_mandala_center_columns
-- Se eliminaron las columnas incorrectas y se mantiene solo el JSON
ALTER TABLE "Mandala" DROP COLUMN "centerName";
ALTER TABLE "Mandala" DROP COLUMN "centerDescription";
ALTER TABLE "Mandala" DROP COLUMN "centerColor";
```

## Ventajas de esta Implementación

✅ **Consistencia**: Todo está en el JSON configuration  
✅ **Flexibilidad**: Fácil agregar nuevos campos al centro  
✅ **Simplicidad**: Un solo lugar de almacenamiento  
✅ **Performance**: Sin joins adicionales innecesarios 