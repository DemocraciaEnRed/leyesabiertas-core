# Changelog

**1.5.0**

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