# Kage Discord Bot

Bot de Discord para crear la estructura competitiva de Kage.

## Requisitos
- Node.js 18 o superior.
- El bot ya debe estar invitado al servidor.
- El bot debe tener permisos suficientes para crear canales y roles.

## Variables
Crea estas variables de entorno:

DISCORD_TOKEN = token secreto del bot
GUILD_ID = ID de tu servidor

NO compartas el token con nadie.

## Ejecutar
npm install
npm start

Cuando el bot esté conectado, usa en Discord:

/setup

El comando requiere permiso Administrador.

IMPORTANTE:
- El setup NO borra canales existentes.
- Solo crea elementos que no encuentre.
- La categoría STAFF se hace privada frente a @everyone y visible para ADMIN.
