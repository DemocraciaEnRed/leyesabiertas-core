# Changelog

**1.3.0**

* Se hizo un FIX donde el link a la propuesta se parseaba como `Object` y habia que sacar el `id`
* DERLA-58 Se agrego el feature de que se envia un correo al diputado al recibir un comentario tanto en fundamentacion como contextual.
* Se hizo un FIX en el saludo, donde a veces no existia nombre a quien saludar.

_Compatible solo con leyesabiertas-core:1.3.0 y leyesabiertas-web:1.3.0_

**1.1.3**

- Fixed contributors count at the end of a project

**1.1.2**

- Fixed not being able to create new document versions

**1.1.1**

- Fixed the payload sent to the notifier for document-closes notificaton. Syncs with leyesabiertas-notifier:1.1.2