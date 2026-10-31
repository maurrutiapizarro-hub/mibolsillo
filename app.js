/* =========================================================
   Mi Bolsillo · app.js
   Aquí está el funcionamiento: guardar, calcular y mostrar.
   ========================================================= */
"use strict";

/* ---------- 1. Configuración ---------- */

// Nombres con los que se guardan los datos en el navegador.
const CLAVE_MOVIMIENTOS = "misMovimientos"; // (el mismo de antes, así no pierdes nada)
const CLAVE_AJUSTES = "miBolsilloAjustes";

// Monedas disponibles.
const MONEDAS = {
  CLP: "Peso chileno",
  USD: "Dólar estadounidense",
  EUR: "Euro",
  ARS: "Peso argentino",
  UYU: "Peso uruguayo",
  PEN: "Sol peruano",
  BRL: "Real brasileño",
  MXN: "Peso mexicano",
  COP: "Peso colombiano",
  GBP: "Libra esterlina"
};

// Categorías según el tipo de movimiento.
const CATEGORIAS = {
  gasto: ["Alimentación", "Transporte", "Vivienda", "Salud", "Entretenimiento", "Compras", "Otros"],
  ingreso: ["Sueldo", "Ventas", "Regalos", "Otros"]
};

// Un ícono para cada categoría.
const ICONOS = {
  "Alimentación": "🛒", "Transporte": "🚌", "Vivienda": "🏠", "Salud": "💊",
  "Entretenimiento": "🎬", "Compras": "🛍️", "Sueldo": "💼", "Ventas": "🏷️",
  "Regalos": "🎁", "Otros": "📦"
};

const formatoDia = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long" });
const formatoMes = new Intl.DateTimeFormat("es-CL", { month: "long" });
const formatoMesCorto = new Intl.DateTimeFormat("es-CL", { month: "short" });
const formatoHoy = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long" });


/* ---------- 2. Elementos de la pantalla ---------- */

function buscar(id) {
  return document.getElementById(id);
}

const pantalla = {
  saludo: buscar("saludo"),

  // Pestañas
  vistaInicio: buscar("vista-inicio"),
  vistaProgreso: buscar("vista-progreso"),
  pestanas: document.querySelectorAll(".pestana"),

  // Tarjeta verde
  balance: buscar("balance"),
  codigoMoneda: buscar("codigo-moneda"),
  botonMoneda: buscar("boton-moneda"),
  saldoInicial: buscar("saldo-inicial"),
  botonSaldoInicial: buscar("boton-saldo-inicial"),
  ingresosMes: buscar("ingresos-mes"),
  gastosMes: buscar("gastos-mes"),

  // Lista
  lista: buscar("lista"),
  vacio: buscar("vacio"),
  contador: buscar("contador"),

  // Registrar movimiento
  abrirRegistro: buscar("abrir-registro"),
  ventanaRegistro: buscar("ventana-registro"),
  cerrarRegistro: buscar("cerrar-registro"),
  formulario: buscar("formulario"),
  monto: buscar("monto"),
  descripcion: buscar("descripcion"),
  categoria: buscar("categoria"),
  fecha: buscar("fecha"),
  error: buscar("error"),

  // Moneda y saldo inicial
  ventanaAjustes: buscar("ventana-ajustes"),
  formularioAjustes: buscar("formulario-ajustes"),
  cancelarAjustes: buscar("cancelar-ajustes"),
  moneda: buscar("moneda"),
  saldoInicialCampo: buscar("saldo-inicial-campo"),

  // Mi progreso
  mesAnterior: buscar("mes-anterior"),
  mesSiguiente: buscar("mes-siguiente"),
  tituloMesProgreso: buscar("titulo-mes-progreso"),
  progresoIngresos: buscar("progreso-ingresos"),
  progresoGastos: buscar("progreso-gastos"),
  progresoAhorro: buscar("progreso-ahorro"),
  categorias: buscar("categorias"),
  categoriasVacio: buscar("categorias-vacio"),
  grafico: buscar("grafico"),
  detalleGrafico: buscar("detalle-grafico"),
  listaProgreso: buscar("lista-progreso"),
  contadorProgreso: buscar("contador-progreso"),
  vacioProgreso: buscar("vacio-progreso"),

  // Aviso
  aviso: buscar("aviso"),
  avisoTexto: buscar("aviso-texto"),
  avisoBoton: buscar("aviso-boton")
};


/* ---------- 3. Ayudantes de fechas ---------- */

function dosDigitos(numero) {
  return String(numero).padStart(2, "0");
}

// Fecha → "AAAA-MM-DD"
function fechaATexto(fecha) {
  return fecha.getFullYear() + "-" + dosDigitos(fecha.getMonth() + 1) + "-" + dosDigitos(fecha.getDate());
}

function hoyTexto() {
  return fechaATexto(new Date());
}

// "AAAA-MM-DD" → fecha real (hora local)
function textoAFecha(texto) {
  const partes = texto.split("-").map(Number);
  return new Date(partes[0], partes[1] - 1, partes[2] || 1);
}

// "2026-10-31" → "2026-10"
function mesDe(textoFecha) {
  return textoFecha.slice(0, 7);
}

function mesActual() {
  return mesDe(hoyTexto());
}

// "2026-10" → "2026-09"
function mesAnterior(mes) {
  const fecha = textoAFecha(mes + "-01");
  fecha.setMonth(fecha.getMonth() - 1);
  return mesDe(fechaATexto(fecha));
}

// "2026-10" → "2026-11"
function mesSiguiente(mes) {
  const fecha = textoAFecha(mes + "-01");
  fecha.setMonth(fecha.getMonth() + 1);
  return mesDe(fechaATexto(fecha));
}

// Pone la primera letra en mayúscula: "octubre" → "Octubre"
function mayuscula(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "2026-10" → "Octubre 2026"
function nombreMesConAnio(mes) {
  const fecha = textoAFecha(mes + "-01");
  return mayuscula(formatoMes.format(fecha)) + " " + fecha.getFullYear();
}

// "Hoy", "Ayer" o algo como "Martes, 28 de octubre"
function nombreDelDia(texto) {
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  if (texto === hoyTexto()) return "Hoy";
  if (texto === fechaATexto(ayer)) return "Ayer";
  return mayuscula(formatoDia.format(textoAFecha(texto)));
}


/* ---------- 4. Ayudantes de dinero ---------- */

// Cómo mostrar el símbolo: "€", "£", "R$"... (el dólar como "US$" para no confundirlo con el peso)
function estiloSimbolo() {
  return ajustes.moneda === "USD" ? "symbol" : "narrowSymbol";
}

// Cuántos decimales usa la moneda (CLP: 0, USD: 2, etc.)
function decimalesMoneda() {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: ajustes.moneda })
    .resolvedOptions().maximumFractionDigits;
}

// 15000 → "$15.000"   |   12.5 → "US$12,50"
function formatearDinero(cantidad) {
  const tieneDecimales = Math.round(cantidad * 100) % 100 !== 0;
  const texto = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: ajustes.moneda,
    currencyDisplay: estiloSimbolo(),
    minimumFractionDigits: tieneDecimales ? decimalesMoneda() : 0,
    maximumFractionDigits: decimalesMoneda()
  }).format(Math.abs(cantidad));
  return (cantidad < 0 ? "−" : "") + texto;
}

// Símbolo de la moneda: "$", "US$", "€"...
function simboloMoneda() {
  const partes = new Intl.NumberFormat("es-CL", {
    style: "currency", currency: ajustes.moneda, currencyDisplay: estiloSimbolo()
  }).formatToParts(0);
  const simbolo = partes.find(function (parte) { return parte.type === "currency"; });
  return simbolo ? simbolo.value : ajustes.moneda;
}

// Mientras escribes: "15000" → "15.000"  y  "12,5" se mantiene como decimal.
function formatearMientrasEscribe(campo) {
  const decimales = decimalesMoneda();
  let texto = campo.value;

  // Si la moneda usa decimales, un punto escrito al final se toma como coma decimal.
  if (decimales > 0 && texto.endsWith(".") && !texto.includes(",")) {
    texto = texto.slice(0, -1) + ",";
  }

  const partes = texto.split(",");
  const entero = partes[0].replace(/\D/g, "").slice(0, 12);
  let resultado = entero ? new Intl.NumberFormat("es-CL").format(Number(entero)) : "";

  if (decimales > 0 && partes.length > 1) {
    const decimal = partes[1].replace(/\D/g, "").slice(0, decimales);
    resultado = (resultado || "0") + "," + decimal;
  }
  campo.value = resultado;
}

// "15.000,50" → 15000.5
function leerMonto(texto) {
  const limpio = texto.replace(/\./g, "").replace(",", ".");
  const numero = Number(limpio);
  return limpio && Number.isFinite(numero) ? Math.round(numero * 100) / 100 : NaN;
}

// 15000.5 → "15.000,5" (para mostrar en un campo de texto)
function montoATextoCampo(numero) {
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: decimalesMoneda() }).format(numero);
}


/* ---------- 5. Guardar y cargar datos ---------- */

function crearId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function leerGuardado(clave, valorPorDefecto) {
  try {
    const texto = localStorage.getItem(clave);
    return texto ? JSON.parse(texto) : valorPorDefecto;
  } catch (problema) {
    return valorPorDefecto;
  }
}

function escribirGuardado(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (problema) {
    mostrarAviso("No se pudo guardar. Revisa el espacio del navegador.");
    return false;
  }
}

function esMovimientoValido(m) {
  return Boolean(m) &&
    (m.tipo === "gasto" || m.tipo === "ingreso") &&
    Number.isFinite(Number(m.monto)) && Number(m.monto) > 0 &&
    typeof m.descripcion === "string" && m.descripcion.trim() !== "" &&
    /^\d{4}-\d{2}-\d{2}$/.test(m.fecha);
}

function cargarMovimientos() {
  const guardados = leerGuardado(CLAVE_MOVIMIENTOS, []);
  if (!Array.isArray(guardados)) return [];

  // A los movimientos antiguos les agregamos lo que les falte (como el "id").
  return guardados.filter(esMovimientoValido).map(function (m, posicion) {
    return {
      id: m.id || crearId(),
      tipo: m.tipo,
      monto: Number(m.monto),
      descripcion: m.descripcion.trim(),
      categoria: m.categoria || "Otros",
      fecha: m.fecha,
      creado: m.creado || posicion
    };
  });
}

function cargarAjustes() {
  const guardados = leerGuardado(CLAVE_AJUSTES, {});
  return {
    moneda: MONEDAS[guardados.moneda] ? guardados.moneda : "CLP",
    saldosIniciales: guardados.saldosIniciales || {} // Ejemplo: { "2026-10": 300000 }
  };
}

function guardarMovimientos() {
  return escribirGuardado(CLAVE_MOVIMIENTOS, movimientos);
}

function guardarAjustes() {
  return escribirGuardado(CLAVE_AJUSTES, ajustes);
}

let ajustes = cargarAjustes();
let movimientos = cargarMovimientos();
guardarMovimientos(); // Guarda de inmediato los "id" nuevos de los movimientos antiguos.


/* ---------- 6. Cálculos del balance ---------- */

// Suma de ingresos menos gastos de los movimientos que cumplan la condición.
function sumarMovimientos(condicion) {
  return movimientos.reduce(function (total, m) {
    if (!condicion(m)) return total;
    return m.tipo === "ingreso" ? total + m.monto : total - m.monto;
  }, 0);
}

// Saldo con que termina un mes.
function saldoFinal(mes) {
  // Buscamos el último mes (hasta este) en que la persona escribió un saldo inicial.
  const mesesDefinidos = Object.keys(ajustes.saldosIniciales)
    .filter(function (m) { return m <= mes; })
    .sort();
  const ultimo = mesesDefinidos[mesesDefinidos.length - 1];

  const base = ultimo ? ajustes.saldosIniciales[ultimo] : 0;
  const desde = ultimo || "";

  return base + sumarMovimientos(function (m) {
    const mesMovimiento = mesDe(m.fecha);
    return mesMovimiento >= desde && mesMovimiento <= mes;
  });
}

// Saldo inicial de un mes: el que escribió la persona, o el final del mes anterior.
function saldoInicial(mes) {
  if (ajustes.saldosIniciales[mes] !== undefined) return ajustes.saldosIniciales[mes];
  return saldoFinal(mesAnterior(mes));
}


/* ---------- 7. Mostrar todo en pantalla ---------- */

function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}

function actualizarMoneda() {
  pantalla.codigoMoneda.textContent = ajustes.moneda;
  const simbolo = simboloMoneda();
  document.querySelectorAll(".simbolo-moneda").forEach(function (elemento) {
    elemento.textContent = simbolo;
  });
  document.querySelectorAll(".campo-monto").forEach(function (campo) {
    campo.style.setProperty("--ancho-simbolo", (simbolo.length * 15) + "px");
  });
  pantalla.monto.placeholder = decimalesMoneda() > 0 ? "0,00" : "0";
}

// Cuánto entró y cuánto salió en un mes.
function totalesDelMes(mes) {
  const totales = { ingresos: 0, gastos: 0 };
  movimientos.forEach(function (m) {
    if (mesDe(m.fecha) !== mes) return;
    if (m.tipo === "ingreso") totales.ingresos += m.monto;
    else totales.gastos += m.monto;
  });
  return totales;
}

function actualizarSaludo() {
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 20 ? "Buenas tardes" : "Buenas noches";
  pantalla.saludo.textContent = saludo + ", hoy es " + formatoHoy.format(new Date());
}

function actualizarResumen() {
  const mes = mesActual();
  const totales = totalesDelMes(mes);
  const ingresos = totales.ingresos;
  const gastos = totales.gastos;

  const total = saldoFinal(mes);
  pantalla.balance.textContent = formatearDinero(total);
  pantalla.balance.classList.toggle("negativo", total < 0);
  pantalla.saldoInicial.textContent = formatearDinero(saldoInicial(mes));
  pantalla.ingresosMes.textContent = formatearDinero(ingresos);
  pantalla.gastosMes.textContent = formatearDinero(gastos);

  const nombreMes = formatoMes.format(new Date());
  document.querySelectorAll(".nombre-mes").forEach(function (elemento) {
    elemento.textContent = nombreMes;
  });
}

function crearFilaMovimiento(m) {
  const fila = crear("li", "movimiento");

  const icono = crear("span", "icono " + m.tipo, ICONOS[m.categoria] || "📦");
  icono.setAttribute("aria-hidden", "true");

  const info = crear("div", "info");
  info.appendChild(crear("strong", "", m.descripcion));
  const detalle = crear("span", "detalle", m.categoria);
  info.appendChild(detalle);

  const signo = m.tipo === "ingreso" ? "+" : "−";
  const importe = crear("span", "importe " + m.tipo, signo + formatearDinero(m.monto));

  const eliminar = crear("button", "boton-eliminar", "×");
  eliminar.type = "button";
  eliminar.dataset.eliminar = m.id;
  eliminar.setAttribute("aria-label", "Eliminar " + m.descripcion);

  fila.append(icono, info, importe, eliminar);
  return fila;
}

// Dibuja los movimientos de un mes en una lista, agrupados por día.
function dibujarLista(mes, lista, contador, vacio) {
  const delMes = movimientos.filter(function (m) { return mesDe(m.fecha) === mes; });

  lista.innerHTML = "";
  vacio.hidden = delMes.length > 0;
  contador.textContent = delMes.length === 1 ? "1 movimiento" :
    delMes.length > 1 ? delMes.length + " movimientos" : "";

  // Del más nuevo al más antiguo.
  delMes.sort(function (a, b) {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
    return b.creado - a.creado;
  });

  let diaAnterior = "";
  delMes.forEach(function (m) {
    if (m.fecha !== diaAnterior) {
      lista.appendChild(crear("li", "dia", nombreDelDia(m.fecha)));
      diaAnterior = m.fecha;
    }
    lista.appendChild(crearFilaMovimiento(m));
  });
}

function actualizarLista() {
  dibujarLista(mesActual(), pantalla.lista, pantalla.contador, pantalla.vacio);
}

function actualizarPantalla() {
  actualizarSaludo();
  actualizarMoneda();
  actualizarResumen();
  actualizarLista();
  actualizarProgreso();
}


/* ---------- 8. Mi progreso ---------- */

let mesElegido = mesActual();

pantalla.mesAnterior.addEventListener("click", function () {
  mesElegido = mesAnterior(mesElegido);
  actualizarProgreso();
});

pantalla.mesSiguiente.addEventListener("click", function () {
  mesElegido = mesSiguiente(mesElegido);
  actualizarProgreso();
});

function actualizarCifras() {
  const totales = totalesDelMes(mesElegido);
  const quedo = totales.ingresos - totales.gastos;

  pantalla.tituloMesProgreso.textContent = nombreMesConAnio(mesElegido);
  pantalla.mesSiguiente.disabled = mesElegido >= mesActual();
  pantalla.progresoIngresos.textContent = formatearDinero(totales.ingresos);
  pantalla.progresoGastos.textContent = formatearDinero(totales.gastos);
  pantalla.progresoAhorro.textContent = formatearDinero(quedo);
  pantalla.progresoAhorro.classList.toggle("negativo", quedo < 0);
}

// Lista de categorías con barras: de la que más gastaste a la que menos.
function actualizarCategorias() {
  const porCategoria = {};
  let totalGastos = 0;

  movimientos.forEach(function (m) {
    if (m.tipo !== "gasto" || mesDe(m.fecha) !== mesElegido) return;
    porCategoria[m.categoria] = (porCategoria[m.categoria] || 0) + m.monto;
    totalGastos += m.monto;
  });

  const ordenadas = Object.keys(porCategoria).sort(function (a, b) {
    return porCategoria[b] - porCategoria[a];
  });

  pantalla.categorias.innerHTML = "";
  pantalla.categoriasVacio.hidden = ordenadas.length > 0;

  ordenadas.forEach(function (nombre) {
    const monto = porCategoria[nombre];
    const porcentaje = Math.round((monto / totalGastos) * 100);

    const fila = crear("li", "categoria");
    const arriba = crear("div", "categoria-arriba");
    const icono = crear("span", "categoria-icono", ICONOS[nombre] || "📦");
    icono.setAttribute("aria-hidden", "true");
    arriba.append(
      icono,
      crear("span", "categoria-nombre", nombre),
      crear("span", "categoria-monto", formatearDinero(monto)),
      crear("span", "categoria-porcentaje", porcentaje + "%")
    );

    const barra = crear("div", "categoria-barra");
    const relleno = crear("span");
    relleno.style.width = Math.max(porcentaje, 1) + "%";
    barra.appendChild(relleno);

    fila.append(arriba, barra);
    pantalla.categorias.appendChild(fila);
  });
}

// Texto bajo el gráfico con los montos del mes tocado.
function mostrarDetalleMes(mes) {
  const totales = totalesDelMes(mes);
  pantalla.detalleGrafico.innerHTML = "";
  pantalla.detalleGrafico.append(
    crear("strong", "", nombreMesConAnio(mes) + ": "),
    "entró " + formatearDinero(totales.ingresos) + " y salió " + formatearDinero(totales.gastos) + "."
  );
  pantalla.grafico.querySelectorAll(".grafico-mes").forEach(function (boton) {
    boton.classList.toggle("elegido", boton.dataset.mes === mes);
  });
}

// Gráfico de barras: los 6 meses que terminan en el mes elegido.
function actualizarGrafico() {
  const meses = [mesElegido];
  while (meses.length < 6) meses.unshift(mesAnterior(meses[0]));

  const datos = meses.map(function (mes) { return { mes: mes, totales: totalesDelMes(mes) }; });
  const maximo = Math.max(1, ...datos.map(function (d) { return Math.max(d.totales.ingresos, d.totales.gastos); }));

  pantalla.grafico.innerHTML = "";
  datos.forEach(function (d) {
    const boton = crear("button", "grafico-mes");
    boton.type = "button";
    boton.dataset.mes = d.mes;
    boton.setAttribute("aria-label",
      nombreMesConAnio(d.mes) + ": entró " + formatearDinero(d.totales.ingresos) +
      ", salió " + formatearDinero(d.totales.gastos));

    const barras = crear("div", "grafico-barras");
    const ingreso = crear("span", "grafico-barra ingreso");
    ingreso.style.height = (d.totales.ingresos / maximo * 100) + "%";
    const gasto = crear("span", "grafico-barra gasto");
    gasto.style.height = (d.totales.gastos / maximo * 100) + "%";
    barras.append(ingreso, gasto);

    const etiqueta = crear("span", "grafico-etiqueta",
      formatoMesCorto.format(textoAFecha(d.mes + "-01")).replace(".", ""));

    boton.append(barras, etiqueta);
    boton.addEventListener("click", function () { mostrarDetalleMes(d.mes); });
    boton.addEventListener("mouseenter", function () { mostrarDetalleMes(d.mes); });
    pantalla.grafico.appendChild(boton);
  });

  mostrarDetalleMes(mesElegido);
}

function actualizarProgreso() {
  actualizarCifras();
  actualizarCategorias();
  actualizarGrafico();
  dibujarLista(mesElegido, pantalla.listaProgreso, pantalla.contadorProgreso, pantalla.vacioProgreso);
}


/* ---------- 9. Pestañas ---------- */

pantalla.pestanas.forEach(function (pestana) {
  pestana.addEventListener("click", function () {
    const vista = pestana.dataset.vista;
    pantalla.vistaInicio.hidden = vista !== "inicio";
    pantalla.vistaProgreso.hidden = vista !== "progreso";

    pantalla.pestanas.forEach(function (otra) {
      const activa = otra === pestana;
      otra.classList.toggle("activa", activa);
      if (activa) otra.setAttribute("aria-current", "page");
      else otra.removeAttribute("aria-current");
    });

    if (vista === "progreso") {
      mesElegido = mesActual();
      actualizarProgreso();
    }
    window.scrollTo(0, 0);
  });
});


/* ---------- 10. Aviso inferior ---------- */

let temporizadorAviso;
let accionAviso = null;

function mostrarAviso(texto, textoBoton, alPresionar) {
  clearTimeout(temporizadorAviso);
  pantalla.avisoTexto.textContent = texto;
  pantalla.avisoBoton.textContent = textoBoton || "";
  accionAviso = alPresionar || null;
  pantalla.aviso.classList.add("visible");
  temporizadorAviso = setTimeout(ocultarAviso, textoBoton ? 5000 : 2500);
}

function ocultarAviso() {
  pantalla.aviso.classList.remove("visible");
  accionAviso = null;
}

pantalla.avisoBoton.addEventListener("click", function () {
  if (accionAviso) accionAviso();
  ocultarAviso();
});


/* ---------- 11. Ventana de moneda y saldo inicial ---------- */

function abrirAjustes() {
  pantalla.moneda.value = ajustes.moneda;
  const definido = ajustes.saldosIniciales[mesActual()];
  pantalla.saldoInicialCampo.value = definido !== undefined ? montoATextoCampo(definido) : "";
  pantalla.ventanaAjustes.showModal();
}

pantalla.botonMoneda.addEventListener("click", abrirAjustes);
pantalla.botonSaldoInicial.addEventListener("click", abrirAjustes);
pantalla.cancelarAjustes.addEventListener("click", function () {
  pantalla.ventanaAjustes.close();
});

// Si cambian la moneda en la ventana, el símbolo del campo cambia al tiro.
pantalla.moneda.addEventListener("change", function () {
  const anterior = ajustes.moneda;
  ajustes.moneda = pantalla.moneda.value;
  actualizarMoneda();
  ajustes.moneda = anterior;
});

pantalla.ventanaAjustes.addEventListener("close", actualizarMoneda);

pantalla.saldoInicialCampo.addEventListener("input", function () {
  formatearMientrasEscribe(pantalla.saldoInicialCampo);
});

pantalla.formularioAjustes.addEventListener("submit", function () {
  ajustes.moneda = pantalla.moneda.value;

  const texto = pantalla.saldoInicialCampo.value.trim();
  if (texto === "") {
    delete ajustes.saldosIniciales[mesActual()];
  } else {
    const saldo = leerMonto(texto);
    if (Number.isFinite(saldo)) ajustes.saldosIniciales[mesActual()] = saldo;
  }

  guardarAjustes();
  actualizarPantalla();
  mostrarAviso("Ajustes guardados ✓");
});

// Llenamos la lista de monedas.
Object.keys(MONEDAS).forEach(function (codigo) {
  const opcion = crear("option", "", MONEDAS[codigo] + " (" + codigo + ")");
  opcion.value = codigo;
  pantalla.moneda.appendChild(opcion);
});


/* ---------- 12. Registrar un movimiento ---------- */

function tipoElegido() {
  return pantalla.formulario.querySelector('input[name="tipo"]:checked').value;
}

function categoriaElegida() {
  const elegida = pantalla.formulario.querySelector('input[name="categoria"]:checked');
  return elegida ? elegida.value : "Otros";
}

// Crea los botones de categoría según sea gasto o ingreso.
function llenarCategorias() {
  const marcada = pantalla.formulario.querySelector('input[name="categoria"]:checked');
  const anterior = marcada ? marcada.value : "";
  const opciones = CATEGORIAS[tipoElegido()];
  const elegir = opciones.includes(anterior) ? anterior : opciones[0];

  pantalla.categoria.innerHTML = "";
  opciones.forEach(function (nombre) {
    const opcion = crear("label", "opcion-categoria");
    const radio = crear("input");
    radio.type = "radio";
    radio.name = "categoria";
    radio.value = nombre;
    radio.checked = nombre === elegir;
    opcion.append(radio, crear("span", "", ICONOS[nombre] + " " + nombre));
    pantalla.categoria.appendChild(opcion);
  });
}

function abrirRegistro() {
  pantalla.error.textContent = "";
  if (!pantalla.fecha.value) pantalla.fecha.value = hoyTexto();
  pantalla.ventanaRegistro.showModal();
}

pantalla.abrirRegistro.addEventListener("click", abrirRegistro);
pantalla.cerrarRegistro.addEventListener("click", function () {
  pantalla.ventanaRegistro.close();
});

// Tocar fuera de una ventana también la cierra.
[pantalla.ventanaRegistro, pantalla.ventanaAjustes].forEach(function (ventana) {
  ventana.addEventListener("click", function (evento) {
    if (evento.target !== ventana) return;
    const caja = ventana.getBoundingClientRect();
    const fuera = evento.clientX < caja.left || evento.clientX > caja.right ||
                  evento.clientY < caja.top || evento.clientY > caja.bottom;
    if (fuera) ventana.close();
  });
});

pantalla.monto.addEventListener("input", function () {
  formatearMientrasEscribe(pantalla.monto);
});

pantalla.formulario.addEventListener("input", function () {
  pantalla.error.textContent = "";
});

pantalla.formulario.addEventListener("change", function (evento) {
  if (evento.target.name === "tipo") llenarCategorias();
});

function mostrarError(mensaje, campo) {
  pantalla.error.textContent = mensaje;
  if (campo) campo.focus();
}

pantalla.formulario.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const monto = leerMonto(pantalla.monto.value);
  const descripcion = pantalla.descripcion.value.trim();
  const fecha = pantalla.fecha.value;

  if (!(monto > 0)) return mostrarError("Escribe un monto mayor a cero.", pantalla.monto);
  if (!descripcion) return mostrarError("Escribe una descripción.", pantalla.descripcion);
  if (!fecha) return mostrarError("Elige una fecha.", pantalla.fecha);
  mostrarError("");

  movimientos.push({
    id: crearId(),
    tipo: tipoElegido(),
    monto: monto,
    descripcion: descripcion,
    categoria: categoriaElegida(),
    fecha: fecha,
    creado: Date.now()
  });

  if (!guardarMovimientos()) {
    movimientos.pop();
    return;
  }

  // Limpiamos monto y descripción, pero dejamos tipo, categoría y fecha.
  pantalla.monto.value = "";
  pantalla.descripcion.value = "";
  pantalla.ventanaRegistro.close();
  actualizarPantalla();
  mostrarAviso("Movimiento guardado ✓");
});


/* ---------- 13. Eliminar movimientos ---------- */

function alTocarLista(evento) {
  const botonEliminar = evento.target.closest("[data-eliminar]");
  if (!botonEliminar) return;

  const posicion = movimientos.findIndex(function (m) { return m.id === botonEliminar.dataset.eliminar; });
  if (posicion === -1) return;

  const eliminado = movimientos.splice(posicion, 1)[0];
  guardarMovimientos();
  actualizarPantalla();

  mostrarAviso("Se eliminó “" + eliminado.descripcion + "”", "Deshacer", function () {
    movimientos.push(eliminado);
    guardarMovimientos();
    actualizarPantalla();
  });
}

// La misma acción sirve para las dos listas (Inicio y Mi progreso).
pantalla.lista.addEventListener("click", alTocarLista);
pantalla.listaProgreso.addEventListener("click", alTocarLista);


/* ---------- 14. Al abrir la app ---------- */

pantalla.fecha.value = hoyTexto();
llenarCategorias();
actualizarPantalla();