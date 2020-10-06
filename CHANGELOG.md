# Changelog

**1.8.0**

Listado de cambios hasta el momento:

1. Inclusión de etiquetas en la plataforma:
    * En el menú “Mi perfil” de usuarios no diputados ahora hay un campo nuevo “Etiquetas de interés”
    * En la carga y edición de proyectos se agregó el campo “Etiquetas” al final del formulario
    * En la página de inicio, en los filtros de proyectos, ahora se puede filtrar por etiquetas
    * Si los usuarios no tienen ninguna etiqueta asignada se les muestra un aviso
    * Nota: los usuarios y proyectos previos a esta actualización no tendrán asignados ninguna etiqueta
2. Mejoras en el inicio de sesión:
    * Se sacó el botón de “Registrarse” y se dejó únicamente el de “Ingresar” (que antes decía “Iniciar sesión”) en todo el sitio web
    * Se sacó el botón de “Iniciar sesión” y se resaltó la sección que invita a registrarse en el formulario de inicio de sesión
3. Nuevo botón de descarga de excel de los proyectos propios, con sus comentarios y aportes, desde el perfil de usuario	
4. Mejoras de diseño en los filtros de proyectos en la página de inicio
5. Nueva funcionalidad de enviar notificaciones a usuarixs interesadxs al publicar proyecto. Y opción en el perfil de usuario para elegir si recibir estas notificaciones o no.
6. Se arregló un error de que en algunos navegadores, bajo ciertas condiciones, no se guardaban bien las modificaciones del perfil de usuario

Compatible con:
* `leyesabiertas-web:1.8.0`
* `leyesabiertas-notifier:1.8.0`
* `leyesabiertas-keycloak:1.8.0`


**1.7.1**

- Mejorado como se loguean los errores del notifier

_Compatible con leyesabiertas-notifier:1.7.1 y leyesabiertas-web:1.7.1_


**1.7.0**

- Agregado sort querystring y otros controles del paginado en /documents/my-documents

_Compatible con leyesabiertas-notifier:1.5.0 y leyesabiertas-web:1.7.0_


**1.6.0**

- Ahora al iniciar el servidor, hay una nueva rutina que actualiza los fields de un custom form, por si hay nuevos campos que ir agregando en el tiempo. En este caso, se agrego `customVideoId` que seria la url que funciona con el reproductor para el servidor de streaming para la HCDN. 
- En cambio, `youtubeId` aun se mantendra por razones de compatibilidad con la BD.

**1.5.0**

- Ahora `GET /documents` cambio su forma de obtener y paginar los resultados que obtiene. En coordinacion con el front, ahora los resultados se paginan, y se fuerza el orden de que en primer lugar aparecen las propuestas abiertas, y luego, las cerradas. Se descarta entonces el uso de "mongoose-paginate" para este caso, lamentablemente el paquete limita mucho llevar a cabo queries complejas.
- Agregado "closed" atributo a todos los documentos que devuelve el API endpoint `/my-documents` 

_Compatible con leyesabiertas-notifier:1.3.0 y leyesabiertas-web:1.5.0_

**1.4.0**

- DERLA-33 Nuevo feature: Poder navegar por las versiones historicas del documento (Agregado obtener la version de un documento)

_Compatible con leyesabiertas-notifier:1.3.0 y leyesabiertas-web:1.4.0_

**1.3.1**

- DERLA-65 Fix error stack=TypeError: timeago is not a function & cannot mongoose.connect() multiple times while connected

_Compatible solo con leyesabiertas-notifier:1.3.0 y leyesabiertas-web:1.3.0_

**1.3.0**

* Se hizo un FIX donde el link a la propuesta se parseaba como `Object` y habia que sacar el `id`
* DERLA-58 Se agrego el feature de que se envia un correo al diputado al recibir un comentario tanto en fundamentacion como contextual.
* Se hizo un FIX en el saludo, donde a veces no existia nombre a quien saludar.

_Compatible solo con leyesabiertas-notifier:1.3.0 y leyesabiertas-web:1.3.0_

**1.1.3**

- Fixed contributors count at the end of a project

**1.1.2**

- Fixed not being able to create new document versions

**1.1.1**

- Fixed the payload sent to the notifier for document-closes notificaton. Syncs with leyesabiertas-notifier:1.1.2