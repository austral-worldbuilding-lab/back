# Lab3 Backend – NestJS

This is the backend service for the **Lab3** worldbuilding platform, built with [NestJS](https://nestjs.com/) and TypeScript. It uses **Docker Compose** for managing the database and integrates Prisma as the ORM.

---

## 🚀 Getting Started

### 1. Clonar el repositorio

```bash
$ git clone https://github.com/your-org/worldbuilding-lab.git
$ cd worldbuilding-lab/back
```
### 2. Configurar los Git Hooks
Para asegurarte de que el código cumpla con los estándares antes de subirlo, configuraremos los git hooks. Ejecuta el script de inicialización:

```bash
$ bash git-hooks/init.sh
```

### 3. Instalar las Dependencias
A continuación, instala todas las dependencias necesarias para el proyecto utilizando npm:

```bash
$ npm install
```

### 4. Configurar las Variables de Entorno
Creá el archivo `.env` en la raíz del proyecto y configurá las variables de entorno necesarias. 

### 5. Iniciar la Base de Datos con Docker Compose
Para iniciar la base de datos, ejecutá el siguiente comando:

```bash
$ docker-compose up -d
```

### 6. Ejecutar las Migraciones de Prisma
Una vez que la base de datos esté en funcionamiento, ejecuta las migraciones de Prisma para asegurar que el esquema de la base de datos esté actualizado:

```bash
$ npx prisma migrate dev --name init
```

El `init` es el nombre de la migración. Podés cambiarlo por el que prefieras.

### 7. Iniciar el Proyecto

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## 8. Correr los Tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
