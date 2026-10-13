# 🍩 El Mundo de las Mini Donas - Sistema de Gestión & Costeo Web

> ⚠️ **Nota de Uso:** Este proyecto es una herramienta de **uso personal e interno** diseñada específicamente para la administración, costeo y control operativo de *El Mundo de las Mini Donas*.

Bienvenido al repositorio oficial del **Sistema de Gestión, Costeo y Logística de Entregas** para **El Mundo de las Mini Donas**, un emprendimiento especializado en desayunos sorpresa, repostería artesanal y detalles especiales en Manizales, Caldas, Colombia.

Esta aplicación web interactiva (PWA Ready) ha sido desarrollada a medida para profesionalizar la operación comercial interna del negocio, permitiendo un control riguroso de inventarios, costeo dinámico de recetas, agenda logística de entregas con integración a WhatsApp y un balance financiero en tiempo real.

---

## 🔒 Propiedad Intelectual, Licencia & Protección Legal

© 2026 **Brissa Higuita Patiño**. Todos los derechos reservados.

- **Autora y Desarrolladora:** Brissa Higuita Patiño
- **Titular del Dominio y Código:** Brissa Higuita Patiño
- **Marca:** El Mundo de las Mini Donas (Manizales, Caldas, Colombia)
- **Tipo de Licencia:** Privada / Propietaria (Propietary Software / All Rights Reserved).

> 🛑 **AVISO LEGAL IMPORTANTE:** 
> Queda estrictamente prohibida la reproducción total o parcial, copia, redistribución, venta, modificación, comercialización o ingeniería inversa de este código fuente, interfaz gráfica, arquitectura de software o material asociado, sin la autorización previa y por escrito de la autora **Brissa Higuita Patiño**. El uso no autorizado de este software o sus componentes constituye una infracción a los derechos de autor y propiedad intelectual sujetas a las sanciones legales correspondientes bajo las leyes de la República de Colombia e instrumentos internacionales aplicables.

---

## 🚀 Características Principales

### 📊 1. Dashboard Financiero & KPIs
- **Balance General:** Visualización inmediata de Ventas Brutas, Ganancias Brutas, Gastos Operativos Totales y **Utilidad Neta Real**.
- **Filtro por Rango de Fechas:** Análisis dinámico por días, semanas o meses con recalculo automático de gráficos interactivos (*Chart.js*).
- **Métricas Operativas:** Conteo total de pedidos ejecutados y productos más populares en ventas.

### 📦 2. Control de Inventario & Insumos
- Registro de materia prima, empaques y elementos decorativos.
- Categorización de materiales (*Materia Prima*, *Empaques*, *Decoración*, *Otros*).
- **Costo Unitario Automático:** Cálculo exacto del valor por gramo, mililitro u unidad según la presentación comprada.

### 💸 3. Control de Gastos Operativos (Costos Fijos)
- Registro de egresos fijos mensuales (publicidad en redes sociales, servicios públicos, arriendo, insumos de limpieza).
- Impacto directo en la Utilidad Neta Real del Dashboard.

### 🧮 4. Calculadora Comercial & Cotizador
- **Cálculo de Precios por Margen:** Aplicación de la fórmula financiera `Costo Total / (1 - Margen%)` para asegurar la rentabilidad deseada.
- **Cotizaciones Instantáneas:** Generador de cotizaciones formateadas con emojis listas para enviar a clientes vía WhatsApp.
- Categorización personalizada de combos y productos finales.

### 🚚 5. Agenda de Pedidos & Logística de Entregas
- **Registro Logístico Completo:** Control de fecha de entrega, franja horaria, destinatario/homenajeado, dirección/barrio en Manizales y teléfono de contacto.
- **Seguimiento de Estado:** Control en tiempo real (*Pendiente*, *En Preparación*, *En Camino*, *Entregado*).
- **Botón Directo a WhatsApp:** Envío automático del resumen del pedido con un solo clic.
- **Comprobante / Recibo Digital:** Generador de recibo imprimible o descargable en PDF.

---

## 🛠️ Tecnologías Utilizadas

- **HTML5:** Estructura semántica.
- **Tailwind CSS (CDN):** Estilos modernos, responsivos y adaptados a la paleta de colores de la marca (rosados pastel, blanco y fucsia).
- **JavaScript (Vanilla JS - ES6+):** Lógica del sistema, manipulación del DOM y operaciones financieras.
- **Chart.js:** Gráficos estadísticos interactivos para el balance de ventas y productos populares.
- **Lucide Icons:** Iconografía limpia y moderna.
- **LocalStorage API:** Persistencia local de datos en el navegador del usuario.

---

## 📁 Estructura del Proyecto

```text
├── index.html        # Estructura principal y componentes de la interfaz
├── styles.css        # Estilos personalizados, gradientes y soporte para impresión
├── app.js            # Lógica del sistema, eventos, gráficos y gestión de almacenamiento
└── README.md         # Documentación, licencias y aviso legal