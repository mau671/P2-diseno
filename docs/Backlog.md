**INSTITUTO TECNOLÓGICO DE COSTA RICA**

**![][image1]**

ESCUELA DE INGENIERÍA EN COMPUTACIÓN

 DISEÑO DE SOFTWARE

**Proyecto \#2**

 

**Profesor:** Ing. Marvin Adolfo Campos Fuentes

 

**Integrantes:**

Sebastián Muñoz Morera (2023090681)

Isaac Jiménez Blanco (2024202804)

Mauricio González Prendas (2024143009)

**Periodo:** Verano del 2025

[Especificación del Proyecto: Cocina Express	3](#heading=)

[1\. Visión general del proyecto	3](#heading=)

[1.1 Descripción del caso	3](#heading=)

[1.2 Objetivo	3](#heading=)

[2\. Arquitectura y stack tecnológico	3](#heading=)

[3\. Estrategia de diseño y UX	3](#heading=)

[3.1 Principios de diseño	3](#heading=)

[3.2 Elementos de diseño UX	4](#heading=)

[3.3 Metáfora del sistema: El Lienzo Culinario	4](#heading=)

[4\. Requerimientos	4](#heading=)

[4.1 Requerimientos funcionales	4](#heading=)

[4.2 Requerimientos no funcionales	5](#heading=)

[5\. Historias de usuario	5](#heading=)

[Historia 1: Configuración de perfil dietético	5](#heading=)

[Historia 2: Exploración de bases gastronómicas	5](#heading=)

[Historia 3: Personalización del platillo (El Lienzo)	6](#heading=)

[Historia 4: Gestión del carrito de compras	6](#heading=)

[Historia 5: Realización de pedido (Checkout)	6](#heading=)

[Historia 6: Administración de ingredientes (Web)	7](#heading=)

[Historia 7: Creación de bases de platillos (Web)	7](#heading=)

[6\. Modelo de Datos	7](#heading=)

[7\. Plan de trabajo (Plannings)	8](#heading=)

# 

# 

# 

# 

# 

# 

# **Especificación del proyecto: Cocina Express**

## **1\. Visión general del proyecto**

### **1.1 Descripción del caso**

Cocina Express es una plataforma de delivery basada en la hiper-personalización de alimentos. El modelo de negocio permite que el cliente defina la preparación exacta de sus alimentos sobre bases gastronómicas provistas por empresas afiliadas. El sistema atiende a clientes ocasionales y a usuarios con requerimientos dietéticos específicos por salud o preferencia personal.

### **1.2 Objetivo**

Desarrollar una solución de software integral que aplique principios de diseño y metodología SCRUM, compuesta por una aplicación móvil para el consumo del usuario final y un portal web administrativo para la gestión de restaurantes e inventarios.

## **2\. Arquitectura y stack tecnológico**

El proyecto utiliza una arquitectura moderna gestionada por Bun para maximizar el rendimiento.

* **Runtime & Gestor de Paquetes:** Bun.  
* **Front-End Web:** React con Vite, Shadcn/UI para componentes visuales, Tanstack Query para estado asíncrono y Tanstack Router para la navegación.  
* **Mobile:** React Native con Expo.  
* **Back-End (API):** Servidor HTTP ejecutado sobre Bun, exponiendo una API RESTful  
  Opciones: Express  
* **Capa de Datos:** ORM (Object Relational Mapping) para la abstracción de la base de datos y protección contra inyecciones SQL. Supabase con Drizzle, Supabase auth

## **3\. Estrategia de diseño y UX**

### **3.1 Principios de diseño**

Se aplican tres principios fundamentales en la arquitectura del software:

### **3.2 Elementos de diseño UX**

1. **Visibilidad del estado del sistema:** La interfaz informa constantemente al usuario sobre lo que ocurre mediante indicadores de carga (skeletons), confirmaciones visuales tipo toast al agregar ítems y estados claros de disponibilidad de ingredientes.  
2. **Prevención de errores:** El sistema bloquea combinaciones de ingredientes que entran en conflicto con las restricciones dietéticas configuradas en el perfil del usuario, emitiendo alertas preventivas antes de permitir la adición al carrito.  
3. **Eficiencia de uso:** Se implementan funciones de "Re-ordenar" y "Guardar Favoritos" para acelerar el proceso de compra de usuarios recurrentes con dietas estrictas.

### **3.3 Metáfora del sistema: El Lienzo Culinario**

La interfaz de personalización trata el plato como un lienzo. La "Base Gastronómica" es el centro de la pantalla, y el usuario dispone de una "paleta" de herramientas (ingredientes y métodos de cocción) que arrastra o selecciona para modificar la composición final, visualizando los cambios en tiempo real.

## **4\. Requerimientos**

### **4.1 Requerimientos funcionales**

**Módulo móvil (Cliente):**

* Registro y autenticación de usuarios.  
* Configuración de perfil de salud (alergias, objetivos nutricionales).  
* Exploración de catálogo de bases gastronómicas.  
* Personalización granular de platillos (adición/remoción de ingredientes).  
* Gestión de carrito de compras y desglose de costos.  
* Procesamiento de órdenes.   
* Programar órdenes

**Módulo web (Administrador):**

* Gestión de restaurantes y cocinas afiliadas.  
* Administración de inventario de ingredientes y costos.  
* Creación y edición de bases de platillos.  
* Dashboard de monitoreo de órdenes activas.

### **4.2 Requerimientos no funcionales**

* La base de datos debe estar poblada con un mínimo de 100 registros en sus entidades principales para las pruebas de carga y demostración.  
* Implementación estricta de ORM para sanitización de consultas y prevención de SQL Injection.  
* La aplicación web administrativa debe ser responsiva.  
* La aplicación móvil debe operar nativamente en dispositivos Android/iOS mediante Expo.

## **5\. Historias de usuario**

### **Historia 1: Configuración de perfil dietético**

Como usuario consciente de mi salud quiero establecer mis restricciones alimenticias y alérgenos en mi perfil para que la aplicación filtre automáticamente opciones peligrosas para mí.

* **Criterios de aceptación:**  
  * El sistema permite seleccionar múltiples alérgenos de un catálogo predefinido.  
  * El usuario define un objetivo nutricional (ej. Keto, Vegano).  
  * La configuración se guarda persistentemente en la base de datos.  
  * La interfaz muestra un resumen visual de las restricciones activas en el perfil.  
* **Subtareas:**  
  * Crear endpoint de actualización de perfil de usuario.  
  * Diseñar esquema de base de datos para restricciones de usuario.  
  * Implementar pantalla de selección múltiple en React Native.  
  * Integrar validaciones de datos en el servidor.  
* **Diseño UX:** Uso de iconos representativos para cada grupo alimenticio.  
* **Diseño de datos:** Relación muchos a muchos entre Usuarios y Restricciones.

### **Historia 2: Exploración de bases gastronómicas**

Como cliente quiero visualizar las bases de comida disponibles categorizadas para elegir el punto de partida de mi platillo.

* **Criterios de aceptación:**  
  * Listado de platillos base con fotografía, nombre y precio inicial.  
  * Filtrado automático ocultando platos que violan las restricciones del perfil.  
  * Buscador por nombre de platillo o tipo de cocina.  
* **Subtareas:**  
  * Endpoint para obtener listado de productos activos.  
  * Implementar componente de tarjeta de producto en móvil.  
  * Lógica de filtrado en el backend basada en el perfil del usuario.  
* **Diseño UX:** Scroll infinito o paginación eficiente usando Tanstack Query.

### **Historia 3: Personalización del platillo (El Lienzo)**

Como usuario exigente quiero modificar los ingredientes de una base seleccionada para adaptar la comida exactamente a mis gustos.

* **Criterios de aceptación:**  
  * Interfaz que muestra los ingredientes predeterminados de la base.  
  * Capacidad para remover ingredientes base.  
  * Capacidad para agregar ingredientes extra con actualización de precio en tiempo real.  
  * Validación que impide dejar un plato sin ingredientes esenciales.  
* **Subtareas:**  
  * Endpoint de detalles de producto con lista de ingredientes modificables.  
  * Lógica de estado en cliente para cálculo de precio dinámico.  
  * Componentes de UI para contadores de ingredientes (add/remove).  
* **Diseño UX:** Feedback háptico al modificar cantidades. Metáfora del Lienzo Culinario aplicada visualmente.

### **Historia 4: Gestión del carrito de compras**

Como comprador quiero revisar los platillos personalizados que he seleccionado para confirmar mi pedido antes de pagar.

* **Criterios de aceptación:**  
  * Vista resumen con el detalle de personalizaciones de cada ítem.  
  * Opción para eliminar ítems del carrito o editar su personalización.  
  * Visualización del subtotal, impuestos y total estimado.  
* **Subtareas:**  
  * Implementación de almacenamiento local persistente para el carrito.  
  * Sincronización de disponibilidad de stock al visualizar el carrito.  
* **Diseño UX:** Animaciones de transición al eliminar ítems.

### **Historia 5: Realización de pedido (Checkout)**

Como cliente listo para comer quiero enviar mi orden a la cocina y recibir confirmación para iniciar el proceso de preparación y entrega.

* **Criterios de aceptación:**  
  * Selección de método de pago y dirección de entrega.  
  * Creación de registro de orden en base de datos con estructura JSON detallada de personalizaciones.  
  * Confirmación visual de éxito y redirección al seguimiento.  
* **Subtareas:**  
  * Endpoint transaccional para creación de órdenes.  
  * Validación final de stock e integridad de precios en backend.  
* **Diseño datos:** Estructura jerárquica de Orden \-\> Detalles \-\> Modificadores.

### **Historia 6: Administración de ingredientes (Web)**

Como administrador del restaurante quiero gestionar el catálogo de ingredientes disponibles para mantener actualizado el inventario y los costos.

* **Criterios de aceptación:**  
  * CRUD (Crear, Leer, Actualizar, Borrar) de ingredientes.  
  * Asignación de precios unitarios y categorías (proteína, vegetal, salsa).  
  * Control de estado activo/inactivo para disponibilidad inmediata.  
* **Subtareas:**  
  * Formularios web con validación usando React Hook Form.  
  * Tablas de datos con paginación y ordenamiento.  
* **Diseño UX:** Uso de Modales para edición rápida sin cambiar de página.

### **Historia 7: Creación de bases de platillos (Web)**

Como administrador quiero componer nuevas bases combinando ingredientes del inventario para ofrecer nuevos productos en la aplicación móvil.

* **Criterios de aceptación:**  
  * Interfaz para seleccionar ingredientes que componen la base.  
  * Definición de reglas (qué ingredientes son removibles por el usuario).  
  * Carga de fotografía del platillo.  
* **Subtareas:**  
  * Lógica de asociación múltiple entre Productos e Ingredientes.  
  * Gestión de subida de archivos para imágenes.  
* **Diseño UX:** Interfaz de "Drag and Drop" o selectores múltiples para composición de recetas.

## **6\. Modelo de datos**

El esquema de base de datos relacional contempla las siguientes entidades principales, las cuales contarán con un mínimo de 100 registros poblados para la entrega final:

1. **Users:** Información de cuenta, perfil, tokens de autenticación.  
2. **DietaryRestrictions:** Catálogo de alérgenos y tipos de dieta.  
3. **Ingredients:** Catálogo atómico de insumos con precios y stock.  
4. **MealBases:** Cabecera de los productos vendibles (Platos).  
5. **BaseIngredients:** Tabla intermedia que define la receta por defecto de cada Base.  
6. **Orders:** Cabecera de transacciones (Cliente, Fecha, Total, Estado).  
7. **OrderItems:** Detalle de productos en una orden.  
8. **ItemCustomizations:** Detalle específico de modificaciones (ingredientes extra/removidos) por ítem.

## **7\. Plan de trabajo (Plannings)**

**Sprint \#1: 13 de Enero \- 20 de Enero**

* Configuración del entorno Bun y repositorios.  
* Definición de arquitectura y configuración de ORM.  
* Implementación de HU-01 (Perfil dietético) y HU-06 (Admin Ingredientes).  
* Despliegue inicial de infraestructura de base de datos.  
* **Entregable:** Repositorio configurado, API funcional con endpoints de usuario e ingredientes.

**Sprint \#2: 20 de Enero \- 27 de Enero**

* Implementación de HU-02 (Exploración), HU-03 (Personalización) y HU-07 (Creación de bases).  
* Integración de componentes UI Shadcn y navegación Tanstack.  
* Desarrollo de la lógica del "Lienzo Culinario" en móvil.  
* **Entregable:** App móvil permite ver menú y personalizar pedidos. Web permite crear platos.

**Sprint \#3: 27 de Enero \- 02 de Febrero**

* Implementación de HU-04 (Carrito) y HU-05 (Checkout).  
* Pruebas integrales de flujo de datos y corrección de errores.  
* Poblado de base de datos (Seeding de \>100 registros).  
* Instalación y despliegue en servicios de nube productivos.  
* **Entregable:** Sistema completo desplegado y funcional con datos de prueba masivos.

**Fecha de Revisión Final:** 2 de Febrero 2025\.

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARAAAABbCAIAAAA0gE1ZAABGYElEQVR4Xu19B1hUV9r/JPlnv93NJjFxN5tNdpPYNZbYjcaosTe6IE1UUBS7CNhFpYhiwIKABSwooqiIgqKIBQQRkd57H5he78xtM//znjsQRbMrRr9v8zzz5khm7tx77jnnvr+3nfecy9MbyUhGemXidT5gJCMZ6dfJCBgjGakLZASMkYzUBTICxkhG6gIZAWMkI3WBjIAxkpG6QEbAGMlIXSAjYIxkpC6QETBGMlIXyAgYIxmpC2QEjJGM1AUyAsZIRuoCGQHzlkmn07Pon55FH9EfHYu+whcj/T7JCJi3SggbjJ5hKZ2eRFhhaR1D6Wl0RNf5RCP9TsgImLdKOlbHMAglOpaEvxSlI2mWxirHSL9LMgLmLZJOr6P0oFMALLSW1JEaPUXqKaRiOp9qpN8JGQHzdolhGZVYIC0sVJdXkioFxTLIQGP1dOfzjPQ7ISNg3jLRbM29+ykr1xX5Byuq63SMXsfQGDBGq+x3SUbAvGXS6uriE9NNbKpWb1WWVCLAMAwyyUgjYH6n9CJgdDgUiv8H/71t//StVc91ANoP/z1zDAqrh+gu/hHHe58hRoccc5qkKKZz1+FsXOAChmUpZF4ZvuHKnj/bQKSu5eqNgjk2Tas2q0oqWQapHIr+bYDh2t/xiDrV1NHHzq1vv6D9mufLi4c7V6B/pvdADB4EnY7Fg9x+9PmLOrMPnNc+is8W3ACuCRQLj6TzRS+UX//x7dILgAGjAdkM6MmioWB0LE2QlFiplsjlMrlCKldJ5eqOIlaoREqlSClHRayUS5RyqUIuxR/QV6FCJlQohQqVWKGUKhQShVIMn9W4qERypUSpJjRquULCF4mbJfJWGRzEJ3NFJUHnK1UixUsKqkFmaIYKF6VUppRIlSJUiUKpJDTQCQbcbVpHY3zAc2F06AgqOpJhtRTqH3SUoSh0bWV9W2ZhdXJm4YWkh+HR18POXYu5mYa+ZhdW1jW2oaYi953RQ2CYhvCwLr+0/M7DTJFcoUP16ygajVTnocQPkGHb4hNLZ9s0rtuiLK9ACENjyrIvcfpphkG11bQKalpaG1qa65uba1uFNQJJDb+tvqmhvrmpprm1rkUglCjUFI2D1IizUPthYudZYnA3gZsBx8DOcB4+FdQbjmqjVjxfaNwLxjBHBDIE1wQ8jPkZGBqNIPADSWoEYhEalaT72aU1dSStZmi6w8pEtxGIpE9yix9lF7QKhDSNpAqCVTsEABNcm58rMCA6OK20pjH2xv2c0iotbRgiHYgw7qlB4foFBfqF/rS3XIePQQQSpNjbi0O+FDAUHlw98ICOaRFIIi8m+h455xca4xt63i802p8rR877wpEYn9Do3WHnfMLO+4Rd8MXFJyzGJwwdjEY/+cA5F/1DL/qFXvQNRT9F+4Sf8wmP2hly+sSlm0VVdTfvPgg6dsr/6Fm/I1F+h076hUb5hZ3zD4v2C0X1n98detY75PSO9rI95BRX0OU+IWd2h0TtConaefjszpBzu0PO+xyO8TscHXji3L2sbAZrDsTHFDCMATAc9zDwbBg0tgRB1jW13cnI33P0gqXbzm+nunw5xv7LsQ6fj7b7Yoz9v35w+uoHp++mu9it8N5/IjYtr6xJIlPTgAuxktgdfMzZfUdJTSPchiXxDEtnwtzGCq4lls2yaVi/WVVRjrkZ2tH5VFSnQnU85qqL1661u/Zt8kPl51XeQc6bA1fuCNzkE7DJd+8674DlXj7hpy/Vt4oozJrAJIau/UIGmc+JbmApwAPwFkYD7j48V0A5LhxQgOHh0XfoGR3AA47gydb2O6GqBULRpesJNs4eo6cujL6WpGUJFuEFMAFMqtXpL968N97cxdzZ/VF2HkVRCE0IM1wfuWZBO54pGA8wIEiK7Qs9NWC82ZaAIwKJ0nAJhj2ACcMeumDoSAfUuWbj7nKdx61+S/QCYAC9GDCgYIAHiirrptqt+WT4/G4jHLsNt/54iNnHQ+Z+PHhOt8Em3Qabdxtk+vEg04++M+82wvaTkQs/GeUMZeSCj4dZfzjY9KNBJujXjwdbfjx43keDLD8abI7PtOw22vrjoWaT7TfcfJh76UaKd1Cou3+I3SrvwT/Z/XW4+V9Hzu8+yr77SIfuI20/Hzv/m4mOX090+nrCQlS+wgV96DHRofdE214TbXtMtP/XBMfuY+Z/MNTi4+9sug+d//WP83aFR2qwrYX5A8Qjft4gkFgdpQMdytQ2tsZcv+fksa//dJduw8z/Mtjk7yOsBk91mbFgm82a/fbrg2xWB85YuH3Y3OV9Jjn0HGszetbS9TuPXL/3pKSu5VzCg+Fzlk6xX/O4qBJXD4B5UWt0CTAIBss3+v9oucT7cOSRs7GHoq7MWbLtj72nTXPyOHjqQujZ2F2HTs60X73cw7e4qgH3jWNjmBvF/eIUDfALLgAKpEpR0UOhOdYHsQxcBtdwYOI+gDqGE7hGA+9hHHGYojj5Db3R6drEksT7aZMsln3Wf9aJ2EQNS2IMUjqQs3opSW/wPzRohuO+M3GtYjmFTFsKlIwBzLgijsc7CkAXKzZkjJ28lDDDzu1Q5EWZUtM+MKjNWH+jxuD26PQUWLrQNQrLAoMsNCgj6BIoUYzfN08vAKZdw8ANWQDM05LqITMW876ey+tp9n4/089GzesxwbbHhPm9Jtr1nmDfB/2dZPev8XZ/HGzJ623F62PH6z2f19fi4xE230y0Rwzda4Jdz4kOPSY5Ihb/ZoLDJ8Os3uttwuthzvvn3O9mut1OLxBIlc0SaY1Qkl1W67kn/C8DTXk9TXm9rXm95qEPfae7rtgdts7v+FrfY8+WdX6h7n6H1/sdXrfnyLJdITNct3890eGPA8x5/5r7bt+Zy/0PKtFjBgXDgESCwUPPDLklJOqekqIf5pWt2HG41wTH9/vP5fWa8dfR8+a4bj0ak5hdUF7T0NoilPJFshaBtKap7XFJTeT1ewvW+PUeNf/zgWb9JzmNs17dd6rzu71mjbNxT8kuhmeNqtW12xDPjmVXAFNZ0+Dz87Gj5683y5RilaZVqVnrd4zXfazzpqBGsUxKaFvk6os3HuwPOV1QXAZMQTMgu1maYTWsjgBBwAEGsxfysFiWZMH2JOEzAwFtQBP8gj7DQaQUWRr+wiUYNQa25gjVzc24ost18AVkPKqRZetFEse1AZ9/Z3Xs8m013BcdByOXZJmKhsY1W3YGhJ2sl8hRC+h24qrFd0H40bCslgOzDupD9hdqkpZhyFaJPL+qvkUkRbYcaBSuOQw2FFCbGYqhSYbR6lhCp9PgtsC8MAN1goUN9jKtYWiVjtG8JS3zAmCwksQcBoIYfX+YXzlwhguv18zPx9gt8tofc/NhdnldXnVjbnVjfk1DQU19UX3TtfSnUxZtfH+gOa+fNa+v5Ucj5q30C80srymsQ+fU59Y0PK2tz61tyCytOR6bYrt6/5ejXHhfzB0+c/nd9AL2GdH8KK9skp3H//Q35/W34/W1fbe3ybxVvlWtIuTbCKSKZ4tQIhNJJSKpVCCVNYukNXzRvSdFq3eHfznG6b2esxdtDZaxyLEm9eBxcCIIbGAkzFoV6oi4O+Nt1n84xJrXY/ZfvrOc5rzt+JWU8kbEkASWsc8RapxCQ9a3SC7feGy9zPfToVa83nNQH3lfmwy3cE98mAun6LQ0VN6ZugSYhrrG1NTMuiY+9xXBfdvPJ3mfjV6545CaAsmFnr9Qonz0+Gl5eSmNXTAQCXB7dGsN4lfM6YAIVMACww3gJDqCFk3RLJIY2D8FRNEUZ3fju4HmwZYPOlGLXCQGKjDoZU41U4ipMUTRV4GKWOwV/PfhNkev3FEjdQWXoWsoDcsUlJXfTE5ubG6GSlnwbjgygBDuSOPOUZwto0Nox/hhKSVLqbjbwX1pDUYy1yoYL2gG9EWPQzJqZFC3A4bFvpeB0O8MI6MZBaixt0AvBww2CUFboi/JWSV9pizoPnzOar8jxXXNFIxYZ6ps4c9bue2P35rw+lrxepl1H27hF3aGeBnENSRTUtPq7nOiW7+5301feistj6G0eh0SGFr0a3VTi5NX4B8R8Pog4Nm812v2Qnc/JfVrPTeMLS5AFQ2tq3aE/bnHTPu1e+VgTyLpSGLAAPrRCXyZ8vC5698i/COm7zH3w0HmCz0DMworESR02KGHaxD7txcSS2TEDkiKaUj6aVn9yl3hnwyz4/WyREpyyNx18SlPOMBQevo3+TBIYKoIpVxJkkjqI5yTJKvfsj+S99kYt+0HFRoNDgogVqblcoVCJSdoEqnlkvqWgprmymaBWK1m2v1mGjsSAqWmii8sb+RXNrW2SpRaGmlAEMHIQGoTSxvRP4KSqLXIDqxtFghlShKahSQlctIR9lArSGR6VTS1ljbwq9AJSrUW6zLkkqAetSlViz2DPh9uc+zKHQKSGZBuQBUwSpIuq2vKr6gtr2tp5AvUBMGpK87vh1w6hhFJ5c2tgkZ+W30LMtkUBEVpaJqgkd2mpVhSptHWC6VtEilFEnoADIQLNDTTJJSUNfJRf6tbxSKVRs1QpE7L4gQ9hJg2hbKK31be0IqsA7FMTtEEwxA4QPDm6UXAtHtl2LxEiIlPzek/1XHukg2ZpVUabK2ylIYhtaDNObNSry+rb5y3fAdohr7zeT2tug+z8j1yWqnVYmZCXAtuH/oDDIlNl6dltTarvIfMWhabnKUhgUVZPTpZ1ySWbgyO+vOQeQCYfjbv9pmzYL2vjABzFtx0EJ3tBTvuWFSCbcKA1kbCU3/tTuag8U6Oq/dKSRBjOiS68LNCNUhUmpCoawOmLH6vLzL5TP7yrandat+nRdUUtI4kacSOFL7LLwX+IVYDQ4BgaMSUdEFFo9uWw90GWvG+mjNw+orYm+kAV50Gcc1v0jDgiYDzDKFqhkSjih64F9Iwn4919T4kw4ChGBKxDkmzCo32aWHZ4RPnvXYfctu4z3HF9uBjF+qbhXrsIaAL86sbw2Oubtt/ZJPfwcXrvLftO5ZdWqei2VaR5Na9dPfdBzbtP56YkXv6WrLrRt+5Tms2+IbklNViLwfBnpYRqrTM7J9Djm8JOOTpG7zM03tf2On8ijotDDw8QaFStcgz6O/DbI5fTtayWiRqEGYkcsWN+492H4zYuv/Eup2Hl2/cE3k+vp4v0GKcIFtMSzLZRZVBx88fiow5evay+459PgdPnUtIu5SckZpX0iKVldU3h1+4Zr92+7HzcXKFEnskOjlBpmblBoZFbgk4uHr7Pse1u47FJjUhyYIlO0L204KKwycvbt17ZOPuw8vX+gQEnXxaXK1E6MMel84QD+D+vAHqDBgddv04tKCPGpo9fyN1vJnz8bOxKo0WBAUD4RQwRsHwpcHZQaK9vsl6xa4/DLDi9UMWi/knw+f5hkapgWXhIWLjGPtgIDFo4A29PjbpwTjrlccuJyPpjlEK8kAgU/qEX/zT0Pm8PpZQVR8z+/UBcmAX4KjnCm4Al9cIQg/cSaihrLZxgZvfwlV7BGoko0FnsFotMhYIkr54K3PIzOW8nnNQC9/pOXuS7brkzHwSTA8ENg16oAx4yeAZd5QOsx7bBSR2kvXZeaVWS7a++8303j8tOR3/AGs3GuZXXngiXQAMPhOHKHRcqBTxvcfPkbzPR7t6H8AjgLBEY8NLn55bsnF38JGI6IKy2pTMPBu3LT1Gm/uHRLdKVWgoi+oFq3f/vGK7z72snPzqBnf/8K++t120OSi7qu7Oo6xFa7y/HG0zet56N+8gD98gT/+DPyD3fajJ9oNRbTIZEjFqmr6Wmmu/cptPUHh2YXleWfXOoNChU2ycvX7Or2zGeowVKVROXkHdR9hEXE4GX0ivQy7WCcTrKzeFno3LK6978KRo+ca9AyfZbTxwslIkgVGj9bnF9XZrfJds3P+4qKKO33bwxPkRM5x7jHOc4eS179i5nNLKU5cSxlm5ffDt9E2Bx6Ry1BiaoJi4O48dVngdjowqKK+++TBnnOXKvj/ZH49LFhFIa+ozckod3bw3+oZkFJbmVdYcOH7hx7mulsu9U/LKCYhnYH4D5ws4BId/fiu9CBgQmO3RCx1CauTFhNnzXXMLStCPSHNiJcmdyWDAQBsqGxqtV/q8/+08Xn8LxOWfjJjnHxZFcICBM35pJ3bioIbc0iorty37jp9Hgp87Df0TyVS+YRf/jAHzTj9LXl8LO/d9GFEvEPZuWTA0uIkFYDY0xEKpdO+Bs6u9ApEUBJWN9CGJVAiZkVdq4rz9/X6mvD4WvN5m/xzn8POJyyIVcjeRCEAOqJaBnMiXMXI7cS1HZyO7KOpqSo8fHb4YbR0SnYgVPw6NvvA4ugQYbqCwWIEAFwZMBO8fo5btDMYmGehSDaNvEMo27zu6yvvgk/Ja5Es0KVT7z17959h5w6YuvJqcLlSTe8JiZi5cG30zGdklaOCu3ns81nLlOKtlNzOyRErV6bi7A6ct/2a84/7I2JL65nqR9Ghscr+fFk1fuPFpWRW6d3F1w4L1AVau29OflsA0lV5fUt/osHb3l8Otdh08J5DI9RBVVzttDOo+0ibyyh0dFlQpWQXTHVa6bgkoreejPiJfKS2nbIL1mm8mWkVcv6UCt0O3NyT6n2OsAo7HKinULraypW32oo2fDJnrF3Glki+UqYjaNvEKn9APh8zdtO+YHAMmr7zBfsVut00BxdU16L4COeHue6TveIv1u4JqmgUCiWrDzkMTzVfcuPcEmzpMo0i2wefol6Msl2wLQrWhseRMDwgc4Mj6S8e9S/QSwGAFZgCMgtCevXJjydot9U0terg96Jj2M38TYGqb+Z7+B4JOnH1dwOCKADAwcc7oSRaCjBotpUlNz406f11OqJH1i90QXbNQtmV/xEcDTXh9kHdk+W4fU1NX78LKBhpsdmRbIm8LTHAGa8FfI9AyYC8BQMob2xw37Pls6Kw9R6P/FwED6iXlUe7chZ6LNgdfTHl0JfnB5eQHu8KjR5qv6P29xZGoyw8LKkwWbnJc71fS2ILaigRco0AcHnP9wMmLFQ2N6B6ZBdWT5m8cZ7Xm/tMiPXajMwprf7L3HGHiej+nEB05HZs44Mf5nn5HW8VK7OaTKpoKv5jUa7zjeIsVSLnpnwcMahhC5s5Dp74abRIcdVUJk6MwkDIN7bXvxGcjZjt67Kxs5BMaxm7F9g/6Tzsae0uLLXAZTTt57vlgwOSAyItKCuxZ5EcGRF7+fJT5lr1hSgVyiKiQqISh0xaFRl+Xa9UMrVVrtVmFZXuPRFxLfoAQlvq4aPzc5WaLt5dVN2OTVY1quZle2OMH274T5j94UgijTeNYn0Gwvnzcu0SdAYMJAIONELDrq5r5T4rKkT1mYFEDU4ER9XqA4T6gCpEOLa6p11Ac8uH4qwMGbDxoCxIcyJQiKJ0GqwgSOQBqlUYqU9IwTFo8B69PSHs6bO4yXu+5vP7WvF6m/xjnGHjiCqHB1hyDTHDwsjgN9W8GtKP76Bw1ozt26ebAn6x3BB/DrgvYHG8bMOh5oAE9fzVpvOnSVbtCb6Rm3b6fikp8ysOohPsn41KyympibqYOn7F0xc6wRqmcRVJdqyEpSqhQIyOKRG4arX2cVzbF3nOKg3t2cbkeHjPztLxh+oKNw0xc7+YUaVh2a0Do3wbO9A+9oNRwQWc0tmTK05JxVuu+HGF++Tby2X4BzEkEGB3TIpE6uvt/Ntz0zM00iNrRoNg1DHPq2l3k/Q6dvSAtpwgJpCWefn/qM2V/xGUVaBi9jNU7eQR81G9y0Clk7YOTRrL0vohLX44x3xIQplSp0XNfteNIn/GOUdfvq+FHDbJJNSQhkEmVJKUkyKOn4wZOcHL2CqlrEsIsDqVGI1tYyx9ltuKz7+ZevP5AA9E+sAkgtUOPUMrN9/wmehEwOizsobCQV8LgSa8XeOF1AcMR3AOH/SDZAXjQcELXAANXMRBGRIoF4QSJIDyFxzUWPAGILDPNQolH4Ik/DzLj9Z3H62fD+3r6j7brHhVWwmmcJ4adIADgS7r5EgKY6nRPS6rsV2722nNAA9e8McDALxgwiIM8gp4DDIvjyFGXE0dNd/A5ck6s0qhUMkIt1RBqZOsraJ2MYU9fTRn4k4vz5iNVbSJkQOtJEkIJuFoWR5Yz88sm2XtMsXfPKSnDT5nJq2hEgBkxdykCjIgglnr5/6nn5N0hFxQEDd68ToMs2+yK2ulOXp8NmR2deE//PGDQYFQ0NM9x2dpt8NzI66mgb9Gw65DiZi6lpA+d7dJ3gt2dR7moW5GXbvT/ydF2+e78sjqVliyq5yPLabzp8ntZhXjoYHooMPLyl2MsN+8NV6oJ5Bc5rNnzxXCrE1dSlCQJAWhKo0MPWc9qWZ1UoQ4KO9dn/AJHj8PVCDDo6VEQZKppE81e6v35cMuI6ESlWou9F8QSyKEl3w5gsOjuAAyyc7A7+yJkfhNgMNeBn459d4PYRiTGgOGc/v8AGMzv2KZAGooSK1VPiirzSqsZPDmBky1AH6Az72Xlj7FY+W5fE15/W14/63d7TFno4SdWQxQbtEq70nyxib9OqGpKplIfOhXjfyRCDWE/4LzOZ70WYDo0zIuAgZU0en103M1vJ85fsuVAg0gO94VwPNyaLxTWC1qjE+4NmeY20W7TfWw7oUcH0Wgd3dDc3FjfguRKRlH1BMdNkx08ckrKDYCpbJ7utGnkbJf72flykkbe0Z/6zXLzDm1oleAeAJ/lVdXNXOj5zffmV1Me6V/QMPWtQssVuz/oN93/aIyc0OI5Fppgmdg7D4fOWjp67mrkDqF66tpa1vuF/2i2cu/hM4n30vxDIhav84lJuCtRqbjniMyDgMgrn39vvXHfMYWakGupZVsOfjFi3rbg03ypDD1ThHgEf7WWLKmqrW1uOxh5sdd4hymLtudVgbUJrKqnawVCk2W7vxpje/nGQxKcFx3n3OqAjf+9DfFK9G8BAzOYFDI3Ib2iMzR/K2DATcJRaUNkCB8FwIRf/PN3XJTMEjno9usRYIC5DRhpL4A2+AseJqqrtkXgdzBy/5EzBKnFd8QhfB3M54Wci/948Nx3+pi9O8AOVfjpd2a+h06RuE0QjYJucJz9TOv+A6EmaymGLGtsya2sJeA+bxIwMPeDTDIEmOBIBBjXncFyCNDjeAOrv3bn4Yg5y3pNXBQRl0K0z4kp1ZpLcfG379+7k1U4yWbzp4Mt9kXEEhBmh2aJlIqLcfF37z3U0vqMktrxjlsmOXo9BQ0DaSY5Vc3TFm4ZNcflwdN89MD2noj9bITNFIdNGYVV0CY9ci+YxyWVU2xXT7Nfm1VSrYcK1Qu8fu4+wjrycjJqL+Lstb7hH/Wf4eyxt65FwHG/RsdGJz0YNnOJ66aQ6sY2ZMa2iFoDjl3YcfDc2espl2/duXb/YW5VgxLyNiEpAXmbCDB7T8Z/9v18j33HpWpCRdP+4Rf/Ndrme/Nl97ILO559WU3D8TMxeWWVcSkZA6Ys6vmTU8KjPAokCjwF5EFMst0wdObyjNwKYGKIBzHYEoFI6jOj/Zr0AmCeYUp4dvAUAaT4yHOn/TbAcNVzodtfbDKRXOUXdvHDQfMhy6a/1bu9zZ3W7pVz8zAgLH4pkLMBYWNw+tGv+ZX1Szz2bg88riK1MGwIhDREq6v5QpftB99B6qWPxTt9rXk9TXpPWhAVl8Qx2i9dxc3pAuEkLAqmmsGwfHkHDdW+KmC4gcauI0PqdCJGv2ZvOO9vQ523BIqwPsRAYmpb2ty2hfyp98wxpiuPXkp5UtGYXVpzKuba3v3Hs3KLm+VKz4ATH/WeM2z28uPXUoqa2nKrGiMvxAUEh2TnFaJep+VXjrXeONbWM70QOf0IQeTj8obJ9luHz1yWkp2PnsejgmJTp23/HDl/z8l4AXLV9XoJRUdcSZpg5rIv7KxYSaDm86Uqhw17Ph06NxR58HowPy4lPxw503XoTy4XbqarAey0VKbeefDMJKvllxLvk7DKlD6fmGKKIHXi4v280gd5xdnlNWXNbbVtYqFKqYFMFqSqab/jVz4ZPX/V3nCBCtmY9P2nJeNt3N/vO8PRa/+93LLyFsGDgvJdwUdOnL/QJBFXt0kd1vl3HzTLI/Ao1rcIE3RKRvZIkyUrd4W1ihV40Djmwv86jfhr0YuAeUX6zYB5GXGA+RgBpo8Vb4DV/+ttvnDtPmTL6rDUeq5ggQsuO/j6EDwdY75y8/6TyKEEwCAcQkxVn1lUOcFxI4SS+1pCFsI3s4ebrrjzKOcNjd5/oNcDDE1TaBweFlfZrN357j9HmS3dlFFQriQgSoztCv3NjPwJtmv/0mcycm2HzXAeM3vJDCu385duKQgkWuh72UVzHL0/6jX3X99bTHZYM8NhzRyH5WevJkoIUqjSRMQmDZiy5LtZbnHJaWqNUqpSXL6VMXr2isETnGISU1RahYokzl66P2rm0vHWbmeuJBXXtCRnFi7x9FmzbU9hZQ3ie3STwso6syWe3QZM9g6JqhdIKYYRKVQBh84P+mGh2ZItsSlpxXXNV29nWS/bjpR5SytyMHQaWnfo9OUe35t9Pcb0B4vlk23XznTysFq+Y4F7wOHoG3UCCcNQ/FbB6p0hHw01d9oYWFpVS2nVcrXmwOmEnhMWf/ityaDpLrMXb55o5brcc2dxTTWpZ5Usez01+0fzFUOnOB09d6O4ovlJXslm30D71VtScoo7WURviv67ACOUgw/TbZAtmGT9Ld/tZem0PkjN/JvLwQcqqGpYvuPQP39w3PRzlJqiAF2Qhwd3v34/68uxdjBT2c8KMPPN7MlOmwprweT9X6AuAoab32XVavWTvIKQ0xdW7Nhns2rbym37wk6ez87JI9Qw+Y2UgFhDJqZnu20LHDVn8dBpTvNcvSNjk/lCCcWotaxKptHeyShdsy1s7BznMXMWOq3bGRWf3CiRq1h9ZmHZntBTCz33OnvsC4+8WFJcmZtbEnI8xnVDgMta35DjZ0rKCzRatVBKxCQ+cN3kt3j1Vs8dwdv3HT18OjantJIgVRStam3jX71xZ9W2vfart2/dH550L10ilTAsWd8sDj9708ndx3HD9vV7Qrb+fPr4xduVja2QSEaB4ZWUkWu6dPNUBw/zpd7THDx/sFw9ytRt0HTncearIi4kN/NFd++nbvQ7ZLvOz33XkWvXkoUtrUjdNrVKj5+/beW6+9spzj/ZeWzyD3uUU0RQYBITNClQam6k5qzbHrpg2W73rQe894YGHT2VkV+oACP2rdB/HWB8QMNwgLF4t5eVpdue0kZ+s0jSJBA/W+raxJVtoqJGQWJ6wZLNP3cfatp9pO3mg+fUJAaMIUSmj0lK+8sgU14vDjBIw8ya6bK9Gsm8/xV6DcCgP4jDZEpVo0hSJ5LWS+T1ImmLQCxXKiFLB89aszi9ii+W55RVZ+SXVrYIwBOAKyEtC0kQZGnxxcqc0iqEkGq+SEUxkLPIsMi9bhSJ60WyBqG0VYi0CyGXKvkCUbMQDa+0VSBWKqUMxLf0aoqpE4gyi0rTc4uRuhAoCQ1kLEOygVZDCCXyBpG0QSyrF0qEMjmJzGBGiwxlBUFXNrdlFBZnFJRUNLZKtRRkUDOQOCNVEMdiEvaduJRdVl/bKimqaXpcUp1aUHHjUf7mvce2+IcWVdTIlbIGQVu9WNIokAqEcjVBQpozw2g02tomwcO88uyK+japGtJHIT1NS0PGHYM6zJconxRVpT4tyatu4MsUFGST0OB/vQX6LwRMLJhkSCcMsHyvj/Xfh88fY+4yymLFSItVIy1WjmgvQ83cBsxa2meqy9cTnD4abP5Oj+ndR9psPXBWDQkTABjwO1k27ELyBwNRkzBgUOkxd/ZS79o2Uecbvx3qEmDg5Gc+dJRnTsBXcjkN7e4+A5yBpKkG3DoOUOBVgbsLMTKuAjBQEU9rcPyK+4lzSiF8hEt7xALCKMCj3G9aPavBSaUGrxmvQ2v3N/Hp3F/wKp+Z0YbVBHAvaC1eq0ZTVEJymo3rptPx9zTPXy6Qy6JirxyNulDTwseheRK3B/4R0CvUFFSVGhJKdVykBkYByxZDngcOFlMUetx6uCsABacdYrflzdN/F2AEctXusEsYMGbv9Dd/r4/NXwaYfzpsVrfhFh8Pt+oo3YZbfTIcHTf9aIjpH/qZvNNjNq/HrE9GzN8SdJbQcg8bmECsUvuGX/rTt5a83hYGwPScO2fZzlrBfy9gDAUYAmcX43VJHc8eX4mji9zyD4j8UKxOrdMpkZuA9wzU4fAhTrbWw8IvqAFZp4wG1pDAChlYW4KXlHFTE7BmhtVp8V8cdERQxGtMwEnkljTjCAdOCwKCtv2CNBhnUIugHLkFZzBrqYe1BhqYOAY9z6q1pN+BE72/t1jgvi/5cWFdq7BRIGoUissbmq/cuL33YEhmbp4KVjPTkKaE8/YhbRYgguqiGFj6ooGqINYDU8ycNjY0BpCDvFwSMnJgUo42zKw9P7xvit4KYD4dMc8vzJB8iZ/xS/jjpYQBE/sRAMaU19/8nT424+22n7p+7+qdjLjb6c+WK8kPr9yBGe4dh2J+nO/1p/6m3Ybbbg6ObgcMTAUI5UrvkJg/fGthAExfAIzJ8l11QjG+26u26rXp9QEDgUAaswhMAmIMAGgwdJAYhtQSBnAAvMmlGMIaMr0G50whHqJwBjEEWrm8brCngJO45UEYFfhHUFVAjCHgZ4ioAFJglQkwJMYtKC8K51Jwm6rRGHJaWAwBn7kFh6QOgAfWISyrgAQ/mGJHvUUG5J1H+Xardg+asnDyfPd5brtsV/s4rvVx9dq7yT80KS1LodFAdhNeJ4YRivPEcSISLHjDGRl4QRvDrbJkQJzgTrSnyMInPGLojkg8QN5/5wF+M/SmATMAUhs/Hf6agBHJVD6GeRgLXj8LXl8LW/cgmYbTVM+RDlsV6GGqSPJuZpGJ8/bPR9ltDopWQyoMhBfRg5So1H7HL/3PQHMw8BBakF/UYzYABkwyjjPfLv02wABm8NJCpEC0mGWxjwPI4bgFR+U56wqIi3IbuJvTPgxewgvsizEErh22uNqndrkqDRyng2lQQ6NxjVixGT4bTmh/mtxtOXi160DMwzpgYM6E02EDDgCMmJ4gmYo6/tmLN712hS9cv89pQ4D7rvDoS/fLq1vaH1mHNsUKC6s3rNu4RnKQhgVK0Ib25nWU9mZjxYNH5iVD/CborQCm+3AwyToA8+oTRi+Z6d8QqDKYdi8lkCMEw0ZeTvlu+tItECWD0cemM0WybHjsLUiK6WX+bl+rdxBgvp4FPgz/vxEwzxJmCB3WFSTWJ2BvAB8auKMz4aOAEU7ScgXOx4viYAUvLDunQOSDeYYX78AeOPgsA+7eMHFd4AjrCtAYKhXR1iatbRFUtbY1tYnVSgLSGmCBPrcbB8fngEZOKAA8uPWUGDPYPXtJ9/836b8eMP8pNQbHQ/Tp+WVzF3ptC4xQUSQMOWfP6PXnk9I+HDyX18vsXdAwVryvZ0933lHZLPhdAIb7DM471hYYMC8XnVxncL0M9uzbC8zqPgcGLITBAwEEgsnUwaZvmJ4FDJiMhr1j2ltqIAYyyqF07LZBY00FbeK23oDGwRNtL//X9LsHDFjpen15Q4uX7+GAQ5FqEs9ygkKHu1+/l/mP0fN4vUzf6W0JyZffzBlr4/GouPpVG/TbCBr5yoB5lr04kaxUqSobW56WVTcLJcAqoHDA2up8Jb4RZicd7KiCHW4W+dx4EahUTdS0tBZV1xTV1FbzW4UqQk6RUo2SIFUsi1dhg+H3kvb8Gj3j/f9CnU/C1PEr1yOCIMRiUZtA2CKSNIokzSIhX9DKFwulWgKQBEDmfDbUR51UpUFCML+6QUFCrA/rGRrKK/PSW6LfK2A4wpVTyM5olciuJ6feupempTtm+uHuWYXlE23deb1M3gG/3wbZZv2mu8YkpcFkzdun1wYMkscEoX7wMMPRzcvEaV1yeg6cgbcaAmvzBUnbARhQHYyGItUkTSlIpqi+LTLu9gaf/YvXeLms37zj57DzN+7Fp2bGpdyrrK9jIaKlxWlGnSv8NdJh+4qiKLxYADibo87nPU8cYJqamm7cSg4KO7M1MML7wJnA8Kj9oRG+hyIir6bkVDVJEbuQJEtDLimCx5P8MquFHss2+JfUNGG/BhlvKj2EmF+1qW+Jfv+AQb4KoyVIQo4EsloF8wjANTq8fwBb29y2ZMvBd/uYIgcGcsn6WP11tF3A0Zj/fsBIJGIEmNmOqwdOdrx2NwvOeCXAwH5FFE0hTRJ7J32hu+9Srz2nr9x8XFBSUFFzPzMnKPzsTMc1Lp67c0oq8PjBxgyvDhhEELmiKD6fL5PJdJyP/mqA0Wg1DS2t23+O6PODo8li76Pnr1+4fnN7YNgkm9XTndZH37gvUREQysaWZ0VNw8bdB/ceOlnfzIcpHZbAsXIK9/X/kt4UYJqsV+5+/1urlwEG4jmdr/4Veh3AwFI7DUVrsDkOYSHQ3KBhwEUmKF1w1I0PBoFVBiZZf5t3e89auilQSYLng21lYDUu1vLvHwb3c/tJHIt2/PTyy+HQqwOG2/0Ih5XgFIblC8Su2w4Mmb3s2r2ncAbOOH3eJOPuDAz7C2B0kLCdkP50gvWyGQ5rbqXnqnD2AzoZMXp9k2DLvuNO63Y9yoP8f2wFwXR8e3W4ko7wW+dgADdgOqWauBQXn5dfAIdwDOuF/jw3GiC+8F5+yL88fuX2Nz/YL/Q4WNbQqiJVNW1tXvsjPh1uMsVhXV5lPT4bniPSX60yhVCuIEg1bAFDU3j/no4qoVKukTruAT5LcPxthQdeGzB6eOx4fkAPgGm2Xrnz/W/Nef0tEWA+GW7tExqthAfHzd2+atPFMqVP2AXDJhiQLvkfAYObgZfV4YJjmLAGk9JqmTaBVCBRJGcUjbdwf7/3HF4/cx7SgT2m/zTf/XFeBctSME+Gd8LkvOqXjTL34OGpgKeMHyacjLefIylKIoM9oCmYc9NAqOfFi18RMIjtKC1NKUm9BtklcjkhESsbhdLlu0OHznZLugvZogwlYxg1RTESuYovRrJFCbMU6B+Jt2PFSNPDLIS2UiBbui2k1ziLg5ExaiwauJHhepdXWnMwMjo9twAca0qN9IVaSwsl8maJTETCvD4s0iLVNKNhaVKtVrWKJIh3FVqKIFGXCaWWSEp74rLe+/rdhzAsjBZPuMASWrFEJpEoVBq81SVMYhqwzalNPcb6+VtpPactddke3iKQ6fHEZ3xazteTnf85ziYlC1ZNs5QGdkfTIyOMlpG0Ctl+qDEEaplOSzOw17ZESqjUePsTNOywORMaBZVSK5EIJLI2NQXDwSKNBE/zzdNvAQwIHE7QVja0WK/a8f5AM17/ebzeFp8Mm+8TGoMBQ+GNvl7gj1+hXwDTF0/MwzzMvwNMZwKJg54dsnR1NQ2tQYejomKuVTcJvX8+/fEgU5jYGYCsMtN/jLb1Czknh3WKhg0hcaoJzIPhHv1CBgGOAYOnOGAqA2YAWRI5oTUNLVEXrt5NzdQC9Ai8aug56gpgEO/AAnqpRlNYVX8t4cH5mIToa8lmq32/m7Pi1t1sdApJy6VKWXFF3dUbd8NORZ+PTyqpbVIiexQBDZmleAdKPbzhjDwZf7/fJJdpDhse5RXjyp/TAai1mTl5xdXVpB4xu7ZFIEx/kn/h6s1jMVfiUjNq24SI5RhSg7zBVpkcWXFn4xJjb6QkpWY+LSlvlUgz8gptlm7pN9724Jm4kupqkViM1HhFi/DGg8wzMVdPnI27mfa0Gba9hDB3x0076FLSg97TXJZsPdKKM/oQUyem5/ScvOifY61SHuejIzSpUSiU1U0ttzOzkzPy+WIpyyIUkEqCLqiounIrJTIm7uL1lIKKBhUJyXMqmqpoartx53HUxcsRF2JuZ+Q0S1RahsQS8M3Tfztg/r2G6UzA1TBfoaCpkxcTbBatu5J4T0mxdx8XjLda+24vc15fvOiy75ypTp4P88pANjIk5GLANhovCfLjPhq6iYOw2ChiKfSvWaYMPnZmyWqvBxlPKOB1DZfu2fnyVwQMtF1P0LobqY837NgfHHI2MSnd70Bk74n2g2cuTboPgJGqVfH3Hv589Gx0XFL4mUvWrhsd3X1vPylRUSzNIMBoMWAYJI237I/8uN/cxRv3VzW3Qs3PbV2CnDxaqVIoNWo1y5bWt+wLPekXfPRyYsqRMzHzV25w3xWYU1ypoViRmgiLSdh56NSl2/ejr95wXesVdDSyvIkff+fhVJt1X46wdtt24NTFuNKK2rySWrdtezf4HTx3LXnr/uPTHNYEn77cKlO9pJN6fdzN+/2mLVq2LaQN7+pS0ybZsv/YFyNNTBZvKKqq08H0mbaotMInKGyChauHz3GEHFavkSiVcUkPvfcdPHnhSkRs4tzFnhbLt9/NK5NRzNOyirW7grfvi4i+nux96NjMBZ4HziS0yJQvvftvpzcDmAoMmD9wgOlljgDjGxajeD3AhMZgwMByS14f8y4CBkI4iO8zSypNF62b77qhor4FKX2xWu0fduGTIba8XjZ4E1qzbiMsPQIjmqVKMAoYFexriS2qFwHD2fLA5yzkL8JCeb0ePafjlxKnWi8OOHxMqlLDFsc4uev5q7sGGHRxVkm109rtnj7B1S1CtZbKKqqausDr2ymLb6aCD3MnK2/VrgORV5ObxbI6oWzboai/DTdf5n24QSTXgYGv4VDRKhEv3bjvj99MX707rEkiRUfAHsJRYPgM1hEkaiHfT6TW+IaetnH1vPHgsUKjbZYp9oSfHDrZysvvSG2brKi+yW7tTv9jF0RaCrnjEafPHj99tl4galMTa33DBk5ddOr6PaFMjrofcuLcoAkmR85dkZB0WmH1dMc1lku98sprn+teO125+aDvdBd7j+Cs/MrU7GKvoKixFm6zHNdeTUlXaEnYyZBlmtqEEZduDp6xzHnDoeomPqunUnOLzRd5BB2LEslkdSLpqt0hfSbO9ws7W9XSGhR2dPS0ebGJGXKKflzV9KPVuhn2HgVVDZ1v/IboLQCmj0W3Yba7QqLxmoQuAwYh7c/f2SA1BW5MbzObNXsUsEz8VQhH8lmmRij3DIzo8YP5tqBwBTIXYKJOl1vZsMjzwIcD573Tx+KdAaiRc/pOdw4+c40vUbCwBTBsWEoynRm5HTAsdnOQc0HC9IiWjr31cLr9yiWwkqkeO57Y5nmhl10CDIJdQNjpsSYLo2/ewwd0QpUKuSJDZiy9mZaNxtEvNGqaw9qgU7EJdx8m3M3YcfDMt1McLVw35pRUYlFBQHaYTl/X0uawyucPX01b73+CL4NVh1BX+w0BMDAeSAYxGQXl0xa4L/bcU9MC2agIsdnl1TMd1g+avDAR6d+GRotFa80Xb7idkSuQqytrGwqKi6UKObJ3NwcdGzrbKS4NYndaRnMlMcljZ0Bqdr5YRTwqrLZw3jDbYUVWUZnhls8TGrreM5aPt9/kcyDSwmXjlz84ue6OyCiulWtgTT+yddEIaRjmTnbJ2Pmblngcrm9pI/TkzkNRY02X3clAmlanockH2UV7jpxJSn0skIgvX4vz8t5TUFovVRHpheVTbNZPMnPLLavufOM3RG8GMJWNfOtV3gAY5CT0tfpg0Dx332NygugqYJDXtuNg1AcYMJAu2cPEdNlOuRqWKL8iCZTqIzHJX4616z/d6crdDGAhCvaSJVjd3ezi6Qu8/qfP7HcgUQ0hZ87AmUsOxyQ1StSwLQAOfuJu/UIdgGnPzNXLCerS7UfTbNeaO3vczS7QQkQGPBzO1+lEXQJMg0DkuGrbRMvlDwtxwFevkanVq3ae+G626430rDa1drG773jzJYfOXIhJuHH+asLpSwlhZy9fuJ5c39wKgWjko0NgEGkY+VKv4D98NcNtx+FGQ5rpL6TDoQsuvBEZm9RzosOWA2flBJesyAoUKrdtIR/2m3s0Nlmu0ezYc7DXiJnDpjluDDzxILdMJFch249gqC37Q4fPdoi7/wgsKEYtJ9RVLYLM/JLoy4lb9hwZOcNh1oLVmYXlnW7N3f3SzdTeU5fYeR7ILq3dG3bh78Pmmy3zLazlA6Mw8AoAPaQnM/fzSn+w3+jqeaClRaCg6fmr94ye45ZZWIonpbUaLSmTq9UaEqabtEQNuvvTsnOx1zz9gwb95DDZanVueU3ne78heh3AYHmKRRWY/WCHlNY3m7hugd37B9gg3+P/9Zlru3K3WKXG5gwJrsVLuQkzI8dvHKfWNfKdNwb+z0CkAazeQ8rq67kzFm8TKYjO176MdMBz4sPRiUPnrHq/z9xZy3cUNfKBnUkWAi0MI9NqL999NHXBxj8PsOL1suD1Nf9//Uz6zXDdFHTmUUGlXKl+oT5DqzgiabqqgR8aFT9h3qqZju5Xkh/KScgk59YqvUzBdA0wZTUNJgs8xpmtSM2rwOOikikVCDDD5ixLevSkQSyZv2TjFEtXhFKxSiWQSUVSqUKhkMpkKpUa3lsEFiODrkMuzY6gc5/0N7dZ419U26SHZuCxBsUCRhsFsWcSCZHgiEt/HzXPfV+EUC7nMlPUFL09KOqvg82PRN9E15TW1O8+eHq06bJ/jbX5cf66U3G3pQrkErLbAsNHzFoQfw92kKEYbZNAGhF7Y+f+I5eu30ZSCXkX0xeszyiq6NxDPTQFeZV9pyx02Xa4TaKsbxEvWr+/71ibncERDUIpzqBGgNEio/FBXvF4R/dlXvubmwRyDWPm7D3wp0UPciAUjtxF7EWyCDBKkq4WSI7FXN8VEH4l8U7y08Ipjp4TrFY9LavFt3vJOP9G6hpgdDigzr3AoD3aDf+up2YPmu78Xj8T3oB57yAl03PWOMvV+dXNhvZyuRHgYEDGB/AYi50CECh4CUc7pWUXj7f2fK+35Tu9rN/vb/tOT/Nhc9fH3c1rlSqQwhUr1fDyQBWBilSpkitVMnRQQbSIFTWt4rtZxat3H/tq4lJeT/O/jbDbfOC0SAMbleHQK84O17NykkpIz53jsu2DgaawgqC3OTIgPxxqM8Xe68jp68WVja0ShQx5D9hqwSmMDElq5HJlk0ASfzfLyd2393irqQ7r4u8+Jmic5QmPhAP9bwVMdW2jubPnF+NszyY/xpdKRSrxqp3Hhs9adis9S6JWubnvGjjeKjopHXQ6kI7UqqurKlv4fIQXkoYIuR6vkom7kzV01vIB05ZeSM6EmXOQygRLq1gaDbdOTbPlNdVNbfzIS7d6jre3WOFdUFsNq8V0pBrAdrLfOKuo+Dsqlm1TEq1i5cOsQuTff/m99Q+WbulPIPK7fS9q1YKEBwAYhZLYfzxuhpNXdNxttYoQKLVOHgHTHNZnwc5vsAsmR9i/AimLANN/itOiLSGNEFZmHz0tmTZ/9ddjrU7G39VC6Bn2aaAY6l5e6XgH9yWbfq7niwiStXPb9vkoi5OJaaBD8doNhVKZlVNQWtcccPT8FNtVCbfStFqyVakxc902yWp5fmmNHuKOeBf8rkzL/kd6HcAwOC+ohd9a29BcXt9y/cETC7ftf+w3i9djNuzFityPb2Z1H2rutv1ASlZRRT2/pqGJ39YG+hOY1wAYvI8pSai1fIG4uoFfWse/m1m4dFPwBwPMeN+Y8HpawCslvjH5U1+zgdOWOKz3WecXwpX1/kdQcfcL8fALcfcPXbUzxHq1zxiLlT0nOHwwyJTXYw7vy+kj5qy49uCJmpucwSOGHV+kZ2gZST0srHT3P4ac6T8PNgfYfGPy//pa/H2kw1jzdYs3BPqHx8YkZd1IL7qVWZyQlnvi4q1Ne4+buGzpP9nh2yn2izb4JD/KUeEXtjw7MM9/NVCXACOVKt13HflwkNnqgFMNkDxGNUrlzlvC+/3kEpOcqtTr95+48M0oc8tVPrefljZLFS0SWcKd+zFxCbVNfMAKGlv8DilUP1+q2hwY+Y9hZgvW+mSVVqlwah0n3ZQE9bSw+sr1pNKqqsfFNTMcNw2cvBDZrlga6xqEsmVee8wWrk/PLy1raom7k17TAO+rqRXKl3qH9J9gcy0pFX3dHHhiwPRFF26nqwiysLJhtsu2IaYrbz8uRpZtQU2rybJdk+w2JD8qUMNMFczJdHAt6vaFhPt9f3JauDWsToj8K4bQaI/F3ur9ow1i+gdPCig8MpROl5pX/qOd1+KNh+r4UnRsz8HTfx9qYrNub1ZZnVCtrROKr99Li72ZnJFfZuayeegc16yiGnSD3Br+T45eCNgZucWI37j8nf9LwCAyhGJaW0OPRqzf5ufisWviPNevxph3H2befaTNJyPtuo2w+3SEzd+GWfQcazHDYbXbRn8Pb/+o89HIeGBgJsMwqwFvTtDRQrni3NUba7bvW+QeMGme+9djbD8ZAstpug2z7o4qGWHz12GWn35n8tkoiy/GWv/j+3lfjrX+Apcvx877F/r7/bx/jLXuPsryL0NM/zTE5KOhJn8dZva3QSaL1wc0iWWwBSG46QwHGB2Dnp9GC7sp6/gixdVbac6eAf2mOn841Pa9b63hFWtfzHj3m1l/GWDefei8z4bNQ134+zDLz4ZZ/m2U9T/H209ZuDEk5kZlk0CjhdUpvwaSZ6lLgEFq8Gpy1hiztX0nOO36+eTjgor4B7mT7Ld2G2Sy4/DJCqH0bl6V1YrdHw2aOcrKbV1AuNe+MBfPXdHXbksIUsPg/d0gJQhe+4XuUlDZ5Ozu23+cqavn7sQHmWX1TfX8NmRS3svIPRoZdy/1iUqrFmuovccuD/zRYfXmoJySinqBMO7OQ3u3zYdOxQpV2qellSu37gmJPM8XSvhy9a6Qs5bOHg+z8tDj9z164esfHVftPBITf+dGWva89T5/G2PlGXg84cHjwFNXB89d3mOi/a5DJ8uqajSEhrNHWHjxGSWUyHxDznb/zmTWku1ZJdWkFrn3TJ1Q7uEf2mPETNOF6xJSn/ClCrFMEZ+cPnT28rnO3tmFNUjGPs6tmGq9+q+DZs1eumVH+HnPwLBlW3wzisqr26TzV3gj7bfz0JkbD54EnorvP92l1wTboIjzFZXVBKHuCA++KXpNwMhksoSk28eiL4WevRwceSH41OUDZ+KDzyQciEoMOpMAH07HB0deOng6NvzslYjzl+6mpapQ67Gcb9cw8BE59A8yc46dvxpyNn7/yauBkVeDTl8NjooPQrVFXQs+E38gKh7VvP9UfCD61VDiUNkfGfdz5FW45BQqcYHonKhrQXBy3KHTV++k5xKwDkSDY8EYMOBxIfDAzgmcc4zEX02zIDEt1//oJccNgT9Yre07aeHXPy748vv5/xhl9a8x87763qrfJIdpC7zW7zl+KjEtu7pJBOsC9bBtGOxB+Z8fQ1cAA0MjUhGRcXdn2K6dbOrssmb7tv0nbFf5TrBw23PkZGFVrUhL33iUZ7Nyx7dT7YbNdpq9cG3o2SuNQinsBsuANwXhB4RkHOBGPlthZd2ew6fMnFbbuq533+Hvvffgzn0hISfOp2cVIWuW1REavaacLwwIjbZd7OG5Y2/Q0VM7Ao8ci46v4YuQriipqVvvvc9h+YbjZy+eu5q00f/Q2ctJiJWRzXQ7M2/esh0zbFbvDzlVUFV3ITltlvOGCRaLN3gHXkhKXeMbOtbM2edgRANEI7AhjjVMW1tb4q07Tmu2DpxiO8V2RUhkdFlZhRYRg+Dd6OK+e9jU+QvW7TwefTUt43HgwbDxFkum2a6Mir2uUKiRmRyf/NByidfAaQ5jzF3s1mw+l3BbqqVUNHspKXW2k/tky0WeO/edT0pz3RY8zszZ7+CJxuYW4LY3ql70rwEYg7+PXC6tRkEQCo1GqdWqSAp1qb3QuFAqLaXUkugEBaEh4A1VhoxwzEfY8scLnLToNIKQawgZ8hZIrYIkVSSqUKMmNSqtRom+IsuNJNUk+qtVdxQtiXw+7jhqCXe+ktTKKVJBUhpku8JiWgKv+oA74hsz3CIQnGtmCIgh6aVUE/w2YXlVbXZxxZ2ckst3H52/+eDGw6fp+WXZZdVVTciBUpEgtQ0AwMsZmZc5+Z2pS4BBXrtWR4rURGFVw93M/PtPCgtrm/Ir65E5zm8VE2pY6U5QmpoWwYPc0luZBU+Kq4QwOajD06l4SSaYVYwhfQffQ6IkCirr7j3Ju343LTn9ydPiqlq+EK+xQ7aPQsvKlXpNq0JRUFqdllWQWVhWXN0okEPMEDVSpdFUNvGfFFdkF5XnFFeVVNVLlbDXHvI7lYS6orYlp7CyqUWoRY+MUJbW1j/OKy6rqhMriTq+KK+0qrFN1PGyOjAnaFqpUFbXNzwprXhUUpFVUlFcUSsQiCktgja8hLqqSZBeUJ5eVJFfWVfb2FRcUfmouPxRcVl5bY2KkDM6xEtEWX1zypPilKzCopp6xFd41Sit1hAlNXD3UiRTlOqqpjZ094ZWIX654Jun1wRMx7eOUNe/l7j4PC5NrwMwOsOibMN3BsdtOT7mPoNF3l45Z4I/W7g4b6eC88IMF5Cwxh0nLutx3BezEieGoeDVu1x2GK4Nr32lkFVNI8SC5YZVYXvzcQgAruLir8Ca/5l+AcxMm8Z1m1QVZb8GGBYAQ5EwAwEvM0Dt1gC4GYolYaEhrB+lWFqG2Bj8Yrx1BW4fbhh0C5aCYcDAsHIFDwj8rGUYJESUJLzcByc04OQvULaEWqfW6EnYEIBkCdiNCc7HCaCQBgQhTh1suURowdIDvxO5gRSJ0yPg/ljf4u0UIV0IdjfCWwQYdq/p6CSDA0WwKMAQLIJ2I5lGwqvd4I2VoILwYyBhA0wkapElp4VNNOCFsRoke0mKoOC9JtBJCLbA2ILPBi80wNv9svg4vA3m1azl16bXBIwOmA4MAK7g8QWDi5O/hsKxJT7KDdMzgIEK8MbNnDjDg48VN15qjlP3cCo73gGExYlezxUup4tj+vbMS7zsWw8baOHqYMcGnCiJ2RYjiWyHIG4VLNkFix+/QwRe4Ah+MwatYcsF2IkW8p9xJw3OFwbrfxAP7cTdmR+fkDPTpnLdJkVZGR4YTkx0PhMYDqEUoQYybeC9wDSNNCXiHxovK0ZNkTOsAnsEDKxJoSnOlcYYgGEF1xB/NoT4ABUaBl74qMWbv9DwrmNIooEEOkiZp1kS7qcFTqYgCMPQWkjwwUqYhTc4QZwGRhb8TQ3kEOO3iNPA+Wp0oQafgbwTPc4A1eIt++BFx+gjvA3T0DsOMIAKjH6dTgMvBcBdwoCB9yfjF7wRLEsgDaahNUhsAbrgGnQedBb2m2UMYGThI7zVFneCMUCPG0AwuaHNr/KAXoNeHzCY9w1c1PHdIPI4GcIZQviw4YDhGxbZ8OnZy4ENue8c1DC+oN8dKuzFgmvquBe+kIMfNuhxwTVz7P7sVUDtqobFdwF246RA+0HD945W4lu03/RVCM5kyJb7aekbdhQEH5XX1DI6koYl7EznU/X47tDp9vsCYa7Fxw1fcY67gXBD8bB1AJgbau4r7mD7kgFDp6BWHKbEwwGognEARHA3YGHJDYYbNw54R5r2JuFdZOBje2MgXA9fcW1AUDX3f3xFxyhBUwyHOObAqoI7xB2HnxhuLohrj6EKXAu+I9cQw0Mz/MZ1tqMi/AuHp2du/oapy4Ax0qsTsAZLacRiZXkDUdtCKhXI/iG57SyM9PskI2DeIiEpB/saIbudBCMC5g71DHZK2M6nGul3QkbAvEVCgAGrG96MDq8/V+p1BMz8gunQ+VQj/U7ICJi3S9y+ehCO4HbjYyEIDEEsI/0+yQiYt0vgqEKCgyGdDWJ74CobAfN7JSNg3i7pIGYEQVl4UxosiIb5FJiKMdLvk4yAebvExa+5GDcXq+Witp3PM9LvhIyA+T8gI1x+v2QEjJGM1AUyAsZIRuoCGQFjJCN1gYyAMZKRukBGwBjJSF0gI2CMZKQukBEwRjJSF8gIGCMZqQtkBIyRjNQFMgLGSEbqAhkBYyQjdYGMgDGSkbpARsAYyUhdICNgjGSkLpARMEYyUhfICBgjGakLZASMkYzUBTICxkhG6gIZAWMkI3WB/j+LR//bQtBPPAAAAABJRU5ErkJggg==>