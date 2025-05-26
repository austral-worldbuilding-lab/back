# 🚨 Error Handling - Cheat Sheet

## 📥 Import
```typescript
import {
  ResourceNotFoundException,      // 404 - Recurso no encontrado
  BusinessLogicException,         // 422 - Error de lógica de negocio
  ExternalServiceException,       // 502 - Error de servicio externo
  ValidationException,            // 400 - Error de validación
  AuthorizationException,         // 403 - Error de autorización
  StateConflictException,         // 409 - Conflicto de estado
  BadRequestException,            // 400 - Petición incorrecta
  UnauthorizedException,          // 401 - No autenticado
  ForbiddenException,             // 403 - Prohibido
  ConflictException,              // 409 - Conflicto
  InternalServerErrorException    // 500 - Error interno
} from '../common/exceptions/custom-exceptions';
```

## 🎯 Cuándo Usar Cada Excepción

| Situación | Excepción | Código |
|-----------|-----------|---------|
| Usuario/Proyecto/Recurso no existe | `ResourceNotFoundException` | 404 |
| Regla de negocio violada | `BusinessLogicException` | 422 |
| Firebase/API externa falla | `ExternalServiceException` | 502 |
| Estado inválido para operación | `StateConflictException` | 409 |
| Permisos insuficientes | `AuthorizationException` | 403 |
| Validación específica falla | `ValidationException` | 400 |
| Token inválido/faltante | `UnauthorizedException` | 401 |
| Acceso denegado | `ForbiddenException` | 403 |
| Datos de entrada incorrectos | `BadRequestException` | 400 |

## ⚡ Ejemplos Rápidos

### Recurso No Encontrado
```typescript
if (!user) {
  throw new ResourceNotFoundException('User', userId);
}
```

### Lógica de Negocio
```typescript
if (activeMandalas > 0) {
  throw new BusinessLogicException('Cannot delete project with active mandalas', {
    projectId, activeMandalaCount: activeMandalas
  });
}
```

### Servicio Externo
```typescript
try {
  return await firebase.verifyToken(token);
} catch (error) {
  throw new ExternalServiceException('Firebase Auth', 'Token verification failed', {
    errorCode: error.code
  });
}
```

### Conflicto de Estado
```typescript
if (invitation.status !== 'PENDING') {
  throw new StateConflictException(invitation.status, 'accept invitation', {
    validStates: ['PENDING']
  });
}
```

### Autorización
```typescript
if (!hasPermission) {
  throw new AuthorizationException('Insufficient permissions for project', {
    userId, projectId, requiredRole: 'admin'
  });
}
```

### Validar Existencia
```typescript
const resource = await this.repository.findById(id);
if (!resource) {
  throw new ResourceNotFoundException('ResourceType', id);
}
```

### Try-Catch para Servicios Externos
```typescript
try {
  return await externalService.call();
} catch (error) {
  throw new ExternalServiceException('ServiceName', 'Operation failed', {
    originalError: error.message
  });
}
```

### Validar Estado Antes de Operación
```typescript
if (currentState !== expectedState) {
  throw new StateConflictException(currentState, 'operation name', {
    validStates: [expectedState]
  });
}
```


## 🚫 Errores Comunes

❌ `throw new Error('Something went wrong')`
✅ `throw new BusinessLogicException('Specific error message', { context })`

❌ `throw new NotFoundException('User not found')`
✅ `throw new ResourceNotFoundException('User', userId)`

❌ `throw new HttpException('Error', 500)`
✅ `throw new ExternalServiceException('ServiceName', 'Error description', { details })` 