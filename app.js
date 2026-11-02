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

// Categorías. Los gastos se dividen en "Necesidades" y "Gustos".
const CATEGORIAS = {
  gasto: {
    "Necesidades": ["Alimentación", "Vivienda", "Cuentas", "Transporte", "Salud", "Educación", "Otros"],
    "Gustos": ["Restaurantes", "Entretenimiento", "Compras", "Viajes"]
  },
  ingreso: {
    "": ["Sueldo", "Ventas", "Regalos", "Otros"]
  },
  ahorro: {
    "": ["Ahorro", "Emergencias", "Metas", "Inversión"]
  }
};

// Un ícono para cada categoría.
const ICONOS = {
  "Alimentación": "🛒", "Vivienda": "🏠", "Cuentas": "💡", "Transporte": "🚌",
  "Salud": "💊", "Educación": "📚", "Restaurantes": "🍽️", "Entretenimiento": "🎬",
  "Compras": "🛍️", "Viajes": "✈️", "Sueldo": "💼", "Ventas": "🏷️", "Regalos": "🎁",
  "Ahorro": "🐷", "Emergencias": "🛟", "Metas": "🎯", "Inversión": "📈", "Otros": "📦"
};

// Texto de ayuda bajo el selector de tipo.
const AYUDA_TIPO = {
  gasto: "Dinero que usaste: compras, cuentas, salidas…",
  ingreso: "Dinero que recibiste: sueldo, ventas, regalos…",
  ahorro: "Dinero que apartas. Baja tu disponible, pero no cuenta como gasto."
};

const formatoDia = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long" });
const formatoMes = new Intl.DateTimeFormat("es-CL", { month: "long" });
const formatoMesCorto = new Intl.DateTimeFormat("es-CL", { month: "short" });


/* ---------- 2. Elementos de la pantalla ---------- */

function buscar(id) {
  return document.getElementById(id);
}

const pantalla = {
  saludo: buscar("saludo"),
  pestanas: document.querySelectorAll(".pestana"),
  vistas: {
    inicio: buscar("vista-inicio"),
    progreso: buscar("vista-progreso"),
    plan: buscar("vista-plan"),
    ajustes: buscar("vista-ajustes")
  },

  // Inicio
  balance: buscar("balance"),
  codigoMoneda: buscar("codigo-moneda"),
  arrastre: buscar("arrastre"),
  botonSueldo: buscar("boton-sueldo"),
  textoSueldo: buscar("texto-sueldo"),
  accionSueldo: buscar("accion-sueldo"),
  ingresosMes: buscar("ingresos-mes"),
  gastosMes: buscar("gastos-mes"),
  ahorroMes: buscar("ahorro-mes"),
  lista: buscar("lista"),
  vacio: buscar("vacio"),
  contador: buscar("contador"),

  // Registrar
  abrirRegistro: buscar("abrir-registro"),
  ventanaRegistro: buscar("ventana-registro"),
  cerrarRegistro: buscar("cerrar-registro"),
  tituloRegistro: buscar("titulo-registro"),
  formulario: buscar("formulario"),
  ayudaTipo: buscar("ayuda-tipo"),
  monto: buscar("monto"),
  descripcion: buscar("descripcion"),
  categoria: buscar("categoria"),
  fecha: buscar("fecha"),
  error: buscar("error"),

  // Progreso
  periodoAnterior: buscar("periodo-anterior"),
  periodoSiguiente: buscar("periodo-siguiente"),
  tituloPeriodo: buscar("titulo-periodo"),
  progresoIngresos: buscar("progreso-ingresos"),
  progresoGastos: buscar("progreso-gastos"),
  progresoAhorro: buscar("progreso-ahorro"),
  progresoLibre: buscar("progreso-libre"),
  reparto: buscar("reparto"),
  repartoLeyenda: buscar("reparto-leyenda"),
  repartoVacio: buscar("reparto-vacio"),
  bloqueAnual: buscar("bloque-anual"),
  grafico: buscar("grafico"),
  detalleGrafico: buscar("detalle-grafico"),
  categorias: buscar("categorias"),
  categoriasVacio: buscar("categorias-vacio"),
  bloqueListaMes: buscar("bloque-lista-mes"),
  listaProgreso: buscar("lista-progreso"),
  contadorProgreso: buscar("contador-progreso"),
  vacioProgreso: buscar("vacio-progreso"),

  // Mi plan
  totalAhorrado: buscar("total-ahorrado"),
  ahorradoAnio: buscar("ahorrado-anio"),
  planSinDatos: buscar("plan-sin-datos"),
  planConDatos: buscar("plan-con-datos"),
  planBase: buscar("plan-base"),
  promedios: buscar("promedios"),
  comparacion: buscar("comparacion"),
  propuestas: buscar("propuestas"),
  simulador: buscar("simulador"),
  simulacion: buscar("simulacion"),

  // Ajustes
  moneda: buscar("moneda"),
  descargarRespaldo: buscar("descargar-respaldo"),
  archivoRespaldo: buscar("archivo-respaldo"),
  borrarTodo: buscar("borrar-todo"),

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
  return new Date(partes[0], (partes[1] || 1) - 1, partes[2] || 1);
}

// "2026-10-31" → "2026-10"
function mesDe(textoFecha) {
  return textoFecha.slice(0, 7);
}

function mesActual() {
  return mesDe(hoyTexto());
}

function anioActual() {
  return hoyTexto().slice(0, 4);
}

// Mueve un mes hacia adelante o atrás: ("2026-10", -1) → "2026-09"
function moverMes(mes, cantidad) {
  const fecha = textoAFecha(mes + "-01");
  fecha.setMonth(fecha.getMonth() + cantidad);
  return mesDe(fechaATexto(fecha));
}

function mayuscula(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "2026-10" → "octubre"
function nombreMes(mes) {
  return formatoMes.format(textoAFecha(mes + "-01"));
}

// "2026-10" → "Octubre 2026"
function nombreMesConAnio(mes) {
  return mayuscula(nombreMes(mes)) + " " + mes.slice(0, 4);
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

// El dólar se muestra "US$" para no confundirlo con el peso.
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
  const redondeado = Math.round(cantidad * 100) / 100;
  const tieneDecimales = Math.round(Math.abs(redondeado) * 100) % 100 !== 0;
  const texto = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: ajustes.moneda,
    currencyDisplay: estiloSimbolo(),
    minimumFractionDigits: tieneDecimales ? decimalesMoneda() : 0,
    maximumFractionDigits: decimalesMoneda()
  }).format(Math.abs(redondeado));
  return (redondeado < 0 ? "−" : "") + texto;
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

// 0.256 → "26%"
function porcentaje(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) + "%" : "0%";
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
    (m.tipo === "gasto" || m.tipo === "ingreso" || m.tipo === "ahorro") &&
    Number.isFinite(Number(m.monto)) && Number(m.monto) > 0 &&
    typeof m.descripcion === "string" && m.descripcion.trim() !== "" &&
    /^\d{4}-\d{2}-\d{2}$/.test(m.fecha);
}

function limpiarMovimientos(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.filter(esMovimientoValido).map(function (m, posicion) {
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
    saldosIniciales: guardados.saldosIniciales || {}
  };
}

function guardarMovimientos() {
  return escribirGuardado(CLAVE_MOVIMIENTOS, movimientos);
}

function guardarAjustes() {
  return escribirGuardado(CLAVE_AJUSTES, { moneda: ajustes.moneda });
}

let ajustes = cargarAjustes();
let movimientos = limpiarMovimientos(leerGuardado(CLAVE_MOVIMIENTOS, []));

// Antes existía "¿Con cuánto empezaste el mes?". Ahora eso se registra como
// un ingreso, así que convertimos esos montos en movimientos de tipo ingreso.
Object.keys(ajustes.saldosIniciales).forEach(function (mes) {
  const monto = Number(ajustes.saldosIniciales[mes]);
  if (monto > 0) {
    movimientos.push({
      id: crearId(), tipo: "ingreso", monto: monto, descripcion: "Saldo inicial",
      categoria: "Otros", fecha: mes + "-01", creado: 0
    });
  }
});
ajustes.saldosIniciales = {};
guardarAjustes();
guardarMovimientos(); // Guarda de inmediato los cambios de arriba.


/* ---------- 6. Cálculos ---------- */

// ¿La categoría es una necesidad o un gusto?
function grupoDe(categoria) {
  return CATEGORIAS.gasto["Gustos"].includes(categoria) ? "gustos" : "necesidades";
}

// Totales de un periodo. El periodo puede ser un mes ("2026-10") o un año ("2026").
function totalesDe(periodo) {
  const t = { ingresos: 0, gastos: 0, necesidades: 0, gustos: 0, ahorro: 0 };
  movimientos.forEach(function (m) {
    if (!m.fecha.startsWith(periodo)) return;
    if (m.tipo === "ingreso") t.ingresos += m.monto;
    if (m.tipo === "ahorro") t.ahorro += m.monto;
    if (m.tipo === "gasto") {
      t.gastos += m.monto;
      t[grupoDe(m.categoria)] += m.monto;
    }
  });
  t.libre = t.ingresos - t.gastos - t.ahorro;
  return t;
}

// Disponible acumulado hasta el final de un mes: lo que entró menos lo que salió o apartaste.
function disponibleHasta(mes) {
  return movimientos.reduce(function (total, m) {
    if (mesDe(m.fecha) > mes) return total;
    return m.tipo === "ingreso" ? total + m.monto : total - m.monto;
  }, 0);
}

function totalAhorrado(periodo) {
  return movimientos.reduce(function (total, m) {
    return m.tipo === "ahorro" && m.fecha.startsWith(periodo || "") ? total + m.monto : total;
  }, 0);
}

function sueldoDelMes(mes) {
  return movimientos.reduce(function (total, m) {
    return m.tipo === "ingreso" && m.categoria === "Sueldo" && mesDe(m.fecha) === mes ? total + m.monto : total;
  }, 0);
}


/* ---------- 7. Ayudante para crear elementos ---------- */

function crear(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;
  return elemento;
}


/* ---------- 8. Pestaña Inicio ---------- */

function actualizarMoneda() {
  pantalla.codigoMoneda.textContent = ajustes.moneda;
  const simbolo = simboloMoneda();
  document.querySelectorAll(".simbolo-moneda").forEach(function (elemento) {
    elemento.textContent = simbolo;
  });
  document.querySelectorAll(".campo-monto").forEach(function (campo) {
    campo.style.setProperty("--ancho-simbolo", (simbolo.length * 15) + "px");
  });
  const ejemplo = decimalesMoneda() > 0 ? "0,00" : "0";
  pantalla.monto.placeholder = ejemplo;
  pantalla.simulador.placeholder = ejemplo;
}

function actualizarSaludo() {
  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buenos días" : hora < 20 ? "Buenas tardes" : "Buenas noches";
  pantalla.saludo.textContent = saludo + ", hoy es " + formatoDia.format(new Date());
}

function actualizarResumen() {
  const mes = mesActual();
  const t = totalesDe(mes);
  const disponible = disponibleHasta(mes);
  const traes = disponibleHasta(moverMes(mes, -1));

  pantalla.balance.textContent = formatearDinero(disponible);
  pantalla.balance.classList.toggle("negativo", disponible < 0);
  pantalla.arrastre.textContent = traes !== 0
    ? "Incluye " + formatearDinero(traes) + (traes > 0 ? " que te quedó de " : " pendiente de ") + nombreMes(moverMes(mes, -1))
    : "";

  pantalla.ingresosMes.textContent = formatearDinero(t.ingresos);
  pantalla.gastosMes.textContent = formatearDinero(t.gastos);
  pantalla.ahorroMes.textContent = formatearDinero(t.ahorro);

  const sueldo = sueldoDelMes(mes);
  pantalla.botonSueldo.classList.toggle("listo", sueldo > 0);
  pantalla.textoSueldo.textContent = sueldo > 0
    ? "Sueldo de " + nombreMes(mes) + ": " + formatearDinero(sueldo)
    : "Registrar sueldo de " + nombreMes(mes);
  pantalla.accionSueldo.textContent = sueldo > 0 ? "✓" : "+";
}

function crearFilaMovimiento(m) {
  const fila = crear("li", "movimiento");

  const icono = crear("span", "icono " + m.tipo, ICONOS[m.categoria] || "📦");
  icono.setAttribute("aria-hidden", "true");

  const info = crear("div", "info");
  info.appendChild(crear("strong", "", m.descripcion));
  let detalle = m.categoria;
  if (m.tipo === "gasto") detalle += grupoDe(m.categoria) === "gustos" ? " · Gusto" : " · Necesidad";
  if (m.tipo === "ahorro") detalle += " · Ahorro";
  info.appendChild(crear("span", "detalle", detalle));

  const signo = m.tipo === "ingreso" ? "+" : "−";
  const importe = crear("span", "importe " + m.tipo, signo + formatearDinero(m.monto));

  const eliminar = crear("button", "boton-eliminar", "×");
  eliminar.type = "button";
  eliminar.dataset.eliminar = m.id;
  eliminar.setAttribute("aria-label", "Eliminar " + m.descripcion);

  fila.append(icono, info, importe, eliminar);
  return fila;
}

// Dibuja los movimientos de un mes, agrupados por día.
function dibujarLista(mes, lista, contador, vacio) {
  const delMes = movimientos.filter(function (m) { return mesDe(m.fecha) === mes; });

  lista.innerHTML = "";
  vacio.hidden = delMes.length > 0;
  contador.textContent = delMes.length === 1 ? "1 movimiento" :
    delMes.length > 1 ? delMes.length + " movimientos" : "";

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


/* ---------- 9. Pestaña Mi progreso ---------- */

let modo = "mes";            // "mes" o "anio"
let periodo = mesActual();   // "2026-11" o "2026"

function moverPeriodo(cantidad) {
  periodo = modo === "mes"
    ? moverMes(periodo, cantidad)
    : String(Number(periodo) + cantidad);
  actualizarProgreso();
}

pantalla.periodoAnterior.addEventListener("click", function () { moverPeriodo(-1); });
pantalla.periodoSiguiente.addEventListener("click", function () { moverPeriodo(1); });

document.querySelectorAll('input[name="modo"]').forEach(function (opcion) {
  opcion.addEventListener("change", function () {
    modo = opcion.value;
    periodo = modo === "mes" ? mesActual() : anioActual();
    actualizarProgreso();
  });
});

function actualizarCifras() {
  const t = totalesDe(periodo);
  pantalla.tituloPeriodo.textContent = modo === "mes" ? nombreMesConAnio(periodo) : "Año " + periodo;
  pantalla.periodoSiguiente.disabled = modo === "mes" ? periodo >= mesActual() : periodo >= anioActual();
  pantalla.progresoIngresos.textContent = formatearDinero(t.ingresos);
  pantalla.progresoGastos.textContent = formatearDinero(t.gastos);
  pantalla.progresoAhorro.textContent = formatearDinero(t.ahorro);
  pantalla.progresoLibre.textContent = formatearDinero(t.libre);
  pantalla.progresoLibre.classList.toggle("negativo", t.libre < 0);
}

// Barra dividida: necesidades, gustos, ahorro y lo que quedó libre.
function actualizarReparto() {
  const t = totalesDe(periodo);
  const base = Math.max(t.ingresos, t.gastos + t.ahorro);
  pantalla.reparto.innerHTML = "";
  pantalla.repartoLeyenda.innerHTML = "";
  pantalla.repartoVacio.hidden = t.ingresos > 0;
  pantalla.reparto.hidden = base === 0;

  const partes = [
    { clave: "necesidades", nombre: "Necesidades", valor: t.necesidades, color: "var(--color-necesidades)" },
    { clave: "gustos", nombre: "Gustos", valor: t.gustos, color: "var(--color-gustos)" },
    { clave: "ahorro", nombre: "Ahorro", valor: t.ahorro, color: "var(--color-ahorro)" },
    { clave: "libre", nombre: "Libre", valor: Math.max(t.libre, 0), color: "#d3dfd7" }
  ];
  if (base === 0) return;

  partes.forEach(function (p) {
    if (p.valor > 0) {
      const tramo = crear("span", p.clave);
      tramo.style.width = (p.valor / base * 100) + "%";
      tramo.title = p.nombre + ": " + formatearDinero(p.valor);
      pantalla.reparto.appendChild(tramo);
    }
    const fila = crear("li");
    const cuadro = crear("span", "cuadro");
    cuadro.style.background = p.color;
    fila.append(
      cuadro,
      crear("span", "nombre", p.nombre),
      crear("span", "valor", formatearDinero(p.valor)),
      crear("span", "porcentaje", porcentaje(p.valor, base))
    );
    pantalla.repartoLeyenda.appendChild(fila);
  });

  if (t.libre < 0) {
    const fila = crear("li");
    fila.append(crear("span", "nombre", "⚠️ Usaste " + formatearDinero(-t.libre) + " más de lo que entró en este periodo."));
    pantalla.repartoLeyenda.appendChild(fila);
  }
}

// Categorías de gasto, de la mayor a la menor.
function actualizarCategorias() {
  const porCategoria = {};
  let totalGastos = 0;
  movimientos.forEach(function (m) {
    if (m.tipo !== "gasto" || !m.fecha.startsWith(periodo)) return;
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
    const parte = Math.round((monto / totalGastos) * 100);
    const grupo = grupoDe(nombre);

    const fila = crear("li", "categoria");
    const arriba = crear("div", "categoria-arriba");
    const icono = crear("span", "categoria-icono", ICONOS[nombre] || "📦");
    icono.setAttribute("aria-hidden", "true");
    const titulo = crear("span", "categoria-nombre", nombre + " ");
    titulo.appendChild(crear("span", "categoria-grupo", grupo === "gustos" ? "Gusto" : "Necesidad"));
    arriba.append(
      icono,
      titulo,
      crear("span", "categoria-monto", formatearDinero(monto)),
      crear("span", "categoria-porcentaje", parte + "%")
    );

    const barra = crear("div", "categoria-barra");
    const relleno = crear("span", grupo);
    relleno.style.width = Math.max(parte, 1) + "%";
    barra.appendChild(relleno);

    fila.append(arriba, barra);
    pantalla.categorias.appendChild(fila);
  });
}

function mostrarDetalleMes(mes) {
  const t = totalesDe(mes);
  pantalla.detalleGrafico.innerHTML = "";
  pantalla.detalleGrafico.append(
    crear("strong", "", nombreMesConAnio(mes) + ": "),
    "entró " + formatearDinero(t.ingresos) + ", gastaste " + formatearDinero(t.gastos) +
    " y ahorraste " + formatearDinero(t.ahorro) + ". "
  );
  const ver = crear("button", "ver-mes", "Ver mes");
  ver.type = "button";
  ver.addEventListener("click", function () {
    modo = "mes";
    buscar("modo-mes").checked = true;
    periodo = mes;
    actualizarProgreso();
    window.scrollTo(0, 0);
  });
  pantalla.detalleGrafico.appendChild(ver);
  pantalla.grafico.querySelectorAll(".grafico-mes").forEach(function (boton) {
    boton.classList.toggle("elegido", boton.dataset.mes === mes);
  });
}

// Gráfico de los 12 meses del año elegido.
function actualizarGrafico() {
  const meses = [];
  for (let i = 1; i <= 12; i++) meses.push(periodo + "-" + dosDigitos(i));

  const datos = meses.map(function (mes) { return { mes: mes, t: totalesDe(mes) }; });
  const maximo = Math.max(1, ...datos.map(function (d) { return Math.max(d.t.ingresos, d.t.gastos); }));

  pantalla.grafico.innerHTML = "";
  datos.forEach(function (d) {
    const boton = crear("button", "grafico-mes");
    boton.type = "button";
    boton.dataset.mes = d.mes;
    boton.setAttribute("aria-label", nombreMesConAnio(d.mes) + ": entró " + formatearDinero(d.t.ingresos) +
      ", gastaste " + formatearDinero(d.t.gastos));

    const barras = crear("div", "grafico-barras");
    const ingreso = crear("span", "grafico-barra ingreso");
    ingreso.style.height = (d.t.ingresos / maximo * 100) + "%";
    const gasto = crear("span", "grafico-barra gasto");
    gasto.style.height = (d.t.gastos / maximo * 100) + "%";
    barras.append(ingreso, gasto);

    const etiqueta = crear("span", "grafico-etiqueta",
      formatoMesCorto.format(textoAFecha(d.mes + "-01")).replace(".", "").slice(0, 3));

    boton.append(barras, etiqueta);
    boton.addEventListener("click", function () { mostrarDetalleMes(d.mes); });
    pantalla.grafico.appendChild(boton);
  });

  const elegido = periodo === anioActual() ? mesActual() : periodo + "-12";
  mostrarDetalleMes(elegido);
}

function actualizarProgreso() {
  actualizarCifras();
  actualizarReparto();
  actualizarCategorias();
  pantalla.bloqueAnual.hidden = modo !== "anio";
  pantalla.bloqueListaMes.hidden = modo !== "mes";
  if (modo === "anio") actualizarGrafico();
  else dibujarLista(periodo, pantalla.listaProgreso, pantalla.contadorProgreso, pantalla.vacioProgreso);
}


/* ---------- 10. Pestaña Mi plan ---------- */

// Promedio de los últimos meses (hasta 3) en que registraste algún ingreso.
function calcularPromedio() {
  const meses = [];
  let mes = mesActual();
  for (let i = 0; i < 12 && meses.length < 3; i++) {
    if (totalesDe(mes).ingresos > 0) meses.push(mes);
    mes = moverMes(mes, -1);
  }
  if (meses.length === 0) return null;

  const p = { ingresos: 0, necesidades: 0, gustos: 0, ahorro: 0, meses: meses };
  meses.forEach(function (m) {
    const t = totalesDe(m);
    p.ingresos += t.ingresos / meses.length;
    p.necesidades += t.necesidades / meses.length;
    p.gustos += t.gustos / meses.length;
    p.ahorro += t.ahorro / meses.length;
  });
  p.libre = p.ingresos - p.necesidades - p.gustos - p.ahorro;
  return p;
}

// Categoría de "Gustos" en la que más gastas, en promedio.
function mayorGusto(meses) {
  const suma = {};
  movimientos.forEach(function (m) {
    if (m.tipo !== "gasto" || grupoDe(m.categoria) !== "gustos") return;
    if (!meses.includes(mesDe(m.fecha))) return;
    suma[m.categoria] = (suma[m.categoria] || 0) + m.monto / meses.length;
  });
  const nombres = Object.keys(suma).sort(function (a, b) { return suma[b] - suma[a]; });
  return nombres.length ? { nombre: nombres[0], monto: suma[nombres[0]] } : null;
}

function agregarPropuesta(icono, partes) {
  const fila = crear("li");
  const iconoEl = crear("span", "propuesta-icono", icono);
  iconoEl.setAttribute("aria-hidden", "true");
  const texto = crear("span");
  partes.forEach(function (parte) {
    texto.append(typeof parte === "string" ? parte : crear("strong", "", parte.fuerte));
  });
  fila.append(iconoEl, texto);
  pantalla.propuestas.appendChild(fila);
}

function actualizarPlan() {
  pantalla.totalAhorrado.textContent = formatearDinero(totalAhorrado());
  pantalla.ahorradoAnio.textContent = "En " + anioActual() + ": " + formatearDinero(totalAhorrado(anioActual()));

  const p = calcularPromedio();
  pantalla.planSinDatos.hidden = p !== null;
  pantalla.planConDatos.hidden = p === null;
  if (!p) return;

  const f = formatearDinero;
  const nombresMeses = p.meses.slice().reverse().map(nombreMes);
  pantalla.planBase.textContent = p.meses.length === 1
    ? "Calculado con " + nombresMeses[0] + ". Mientras más meses registres, más preciso será."
    : "Promedio de " + nombresMeses.slice(0, -1).join(", ") + " y " + nombresMeses[nombresMeses.length - 1] + ".";

  // Promedios
  pantalla.promedios.innerHTML = "";
  [
    ["Entra", p.ingresos],
    ["Necesidades", p.necesidades],
    ["Gustos", p.gustos],
    ["Ahorro", p.ahorro],
    ["Te queda libre", p.libre]
  ].forEach(function (fila, i) {
    const li = crear("li");
    li.append(crear("span", "", fila[0]), crear("span", "valor" + (i === 4 ? " destacado" : ""), f(fila[1])));
    pantalla.promedios.appendChild(li);
  });

  // Comparación con 50/30/20
  pantalla.comparacion.innerHTML = "";
  [
    { nombre: "Necesidades", valor: p.necesidades, ref: 50, color: "var(--color-necesidades)" },
    { nombre: "Gustos", valor: p.gustos, ref: 30, color: "var(--color-gustos)" },
    { nombre: "Ahorro", valor: p.ahorro, ref: 20, color: "var(--color-ahorro)" }
  ].forEach(function (c) {
    const tuyo = Math.round(c.valor / p.ingresos * 100);
    const li = crear("li");
    const arriba = crear("div", "comparacion-arriba");
    arriba.append(
      crear("span", "comparacion-nombre", c.nombre),
      crear("span", "comparacion-tuyo", "Tú: " + tuyo + "%"),
      crear("span", "comparacion-ref", "· ref. " + c.ref + "%")
    );
    const barra = crear("div", "comparacion-barra");
    const relleno = crear("span", "relleno");
    relleno.style.width = Math.min(tuyo, 100) + "%";
    relleno.style.background = c.color;
    const marca = crear("span", "marca-ref");
    marca.style.left = c.ref + "%";
    marca.title = "Referencia: " + c.ref + "%";
    barra.append(relleno, marca);
    li.append(arriba, barra);
    pantalla.comparacion.appendChild(li);
  });

  // Propuestas basadas en tus números
  pantalla.propuestas.innerHTML = "";
  const tasaAhorro = p.ahorro / p.ingresos;

  if (p.libre > 0) {
    agregarPropuesta("💡", [
      "En promedio te quedan ", { fuerte: f(p.libre) }, " libres al mes. Si los apartas como ahorro apenas recibes tu sueldo, en un año juntarías ",
      { fuerte: f(p.libre * 12) }, "."
    ]);
  } else if (p.libre < 0) {
    agregarPropuesta("⚠️", [
      "En promedio usas ", { fuerte: f(-p.libre) }, " más de lo que entra al mes. Revisa tus gustos: es lo más fácil de ajustar."
    ]);
  }

  if (p.gustos / p.ingresos > 0.3) {
    const exceso = p.gustos - p.ingresos * 0.3;
    agregarPropuesta("🎯", [
      "Tus gustos son el ", { fuerte: Math.round(p.gustos / p.ingresos * 100) + "%" }, " de lo que entra. Si los llevas al 30%, liberarías ",
      { fuerte: f(exceso) }, " al mes (", { fuerte: f(exceso * 12) }, " al año)."
    ]);
  }

  const gusto = mayorGusto(p.meses);
  if (gusto && gusto.monto > 0) {
    agregarPropuesta(ICONOS[gusto.nombre] || "🛍️", [
      "Donde más gastas en gustos es ", { fuerte: gusto.nombre }, ": ", { fuerte: f(gusto.monto) },
      " al mes. Bajarlo un 20% serían ", { fuerte: f(gusto.monto * 0.2) }, " más para ahorrar cada mes."
    ]);
  }

  if (tasaAhorro >= 0.2) {
    agregarPropuesta("🌱", [
      "¡Vas muy bien! Apartas el ", { fuerte: Math.round(tasaAhorro * 100) + "%" }, " de lo que entra, por sobre el 20% de referencia."
    ]);
  } else {
    agregarPropuesta("🐷", [
      "Hoy apartas el ", { fuerte: Math.round(tasaAhorro * 100) + "%" }, " de lo que entra. Para llegar al 20% tendrías que ahorrar ",
      { fuerte: f(p.ingresos * 0.2) }, " al mes (", { fuerte: f(Math.max(p.ingresos * 0.2 - p.ahorro, 0)) }, " más que ahora)."
    ]);
  }

  if (p.necesidades > 0) {
    const emergencias = movimientos.reduce(function (s, m) {
      return m.tipo === "ahorro" && m.categoria === "Emergencias" ? s + m.monto : s;
    }, 0);
    agregarPropuesta("🛟", [
      "Un fondo de emergencia suele cubrir de 3 a 6 meses de necesidades. Para ti serían entre ",
      { fuerte: f(p.necesidades * 3) }, " y ", { fuerte: f(p.necesidades * 6) }, ". Llevas ",
      { fuerte: f(emergencias) }, " en la categoría Emergencias."
    ]);
  }

  // Sugerencia inicial para el simulador
  if (!pantalla.simulador.value) {
    const sugerido = Math.max(p.libre, p.ingresos * 0.1, 0);
    pantalla.simulador.value = sugerido > 0 ? new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(Math.round(sugerido)) : "";
  }
  actualizarSimulacion();
}

function actualizarSimulacion() {
  const mensual = leerMonto(pantalla.simulador.value) || 0;
  pantalla.simulacion.innerHTML = "";
  [3, 6, 12].forEach(function (meses) {
    const caja = crear("div");
    caja.append(crear("span", "", "En " + meses + " meses"), crear("strong", "", formatearDinero(mensual * meses)));
    pantalla.simulacion.appendChild(caja);
  });
}

pantalla.simulador.addEventListener("input", function () {
  formatearMientrasEscribe(pantalla.simulador);
  actualizarSimulacion();
});


/* ---------- 11. Pestaña Ajustes ---------- */

Object.keys(MONEDAS).forEach(function (codigo) {
  const opcion = crear("option", "", MONEDAS[codigo] + " (" + codigo + ")");
  opcion.value = codigo;
  pantalla.moneda.appendChild(opcion);
});

pantalla.moneda.addEventListener("change", function () {
  ajustes.moneda = pantalla.moneda.value;
  guardarAjustes();
  pantalla.simulador.value = "";
  actualizarPantalla();
  mostrarAviso("Moneda cambiada a " + MONEDAS[ajustes.moneda]);
});

// Descarga un archivo con todos tus datos.
pantalla.descargarRespaldo.addEventListener("click", function () {
  const datos = { app: "Mi Bolsillo", version: 4, fecha: hoyTexto(), ajustes: { moneda: ajustes.moneda }, movimientos: movimientos };
  const archivo = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const enlace = crear("a");
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = "mi-bolsillo-respaldo-" + hoyTexto() + ".json";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(function () { URL.revokeObjectURL(enlace.href); }, 1000);
  mostrarAviso("Respaldo descargado ✓");
});

// Recupera los datos desde un archivo de respaldo.
pantalla.archivoRespaldo.addEventListener("change", function () {
  const archivo = pantalla.archivoRespaldo.files[0];
  pantalla.archivoRespaldo.value = "";
  if (!archivo) return;

  archivo.text().then(function (texto) {
    const datos = JSON.parse(texto);
    const recuperados = limpiarMovimientos(datos.movimientos);
    if (datos.app !== "Mi Bolsillo") throw new Error("no es un respaldo");

    const confirmar = window.confirm(
      "Este respaldo tiene " + recuperados.length + " movimientos. " +
      "Reemplazará los " + movimientos.length + " que tienes ahora en este dispositivo. ¿Continuar?"
    );
    if (!confirmar) return;

    movimientos = recuperados;
    if (datos.ajustes && MONEDAS[datos.ajustes.moneda]) ajustes.moneda = datos.ajustes.moneda;
    guardarMovimientos();
    guardarAjustes();
    pantalla.simulador.value = "";
    actualizarPantalla();
    mostrarAviso("Datos recuperados ✓");
  }).catch(function () {
    mostrarAviso("Ese archivo no es un respaldo de Mi Bolsillo.");
  });
});

pantalla.borrarTodo.addEventListener("click", function () {
  const confirmar = window.confirm("¿Seguro? Se borrarán los " + movimientos.length + " movimientos de este dispositivo.");
  if (!confirmar) return;
  movimientos = [];
  guardarMovimientos();
  pantalla.simulador.value = "";
  actualizarPantalla();
  mostrarAviso("Se borraron tus datos");
});


/* ---------- 12. Pestañas ---------- */

function irA(vista) {
  Object.keys(pantalla.vistas).forEach(function (nombre) {
    pantalla.vistas[nombre].hidden = nombre !== vista;
  });
  pantalla.pestanas.forEach(function (pestana) {
    const activa = pestana.dataset.vista === vista;
    pestana.classList.toggle("activa", activa);
    if (activa) pestana.setAttribute("aria-current", "page");
    else pestana.removeAttribute("aria-current");
  });
  if (vista === "progreso") {
    periodo = modo === "mes" ? mesActual() : anioActual();
    actualizarProgreso();
  }
  if (vista === "plan") actualizarPlan();
  window.scrollTo(0, 0);
}

pantalla.pestanas.forEach(function (pestana) {
  pestana.addEventListener("click", function () { irA(pestana.dataset.vista); });
});
pantalla.codigoMoneda.addEventListener("click", function () { irA("ajustes"); });


/* ---------- 13. Aviso inferior ---------- */

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


/* ---------- 14. Registrar un movimiento ---------- */

function tipoElegido() {
  return pantalla.formulario.querySelector('input[name="tipo"]:checked').value;
}

function categoriaElegida() {
  const elegida = pantalla.formulario.querySelector('input[name="categoria"]:checked');
  return elegida ? elegida.value : "Otros";
}

// Crea los botones de categoría según el tipo (con grupos para los gastos).
function llenarCategorias(preferida) {
  const tipo = tipoElegido();
  const grupos = CATEGORIAS[tipo];
  const todas = [].concat(...Object.values(grupos));
  const anterior = preferida || categoriaElegida();
  const elegir = todas.includes(anterior) ? anterior : todas[0];

  pantalla.ayudaTipo.textContent = AYUDA_TIPO[tipo];
  pantalla.categoria.innerHTML = "";
  Object.keys(grupos).forEach(function (grupo) {
    if (grupo) pantalla.categoria.appendChild(crear("span", "grupo-categoria", grupo));
    grupos[grupo].forEach(function (nombre) {
      const opcion = crear("label", "opcion-categoria");
      const radio = crear("input");
      radio.type = "radio";
      radio.name = "categoria";
      radio.value = nombre;
      radio.checked = nombre === elegir;
      opcion.append(radio, crear("span", "", ICONOS[nombre] + " " + nombre));
      pantalla.categoria.appendChild(opcion);
    });
  });
}

function abrirRegistro(opciones) {
  opciones = opciones || {};
  pantalla.error.textContent = "";
  if (!pantalla.fecha.value) pantalla.fecha.value = hoyTexto();
  if (opciones.tipo) buscar("tipo-" + opciones.tipo).checked = true;
  llenarCategorias(opciones.categoria);
  if (opciones.descripcion !== undefined) pantalla.descripcion.value = opciones.descripcion;
  pantalla.tituloRegistro.textContent = opciones.titulo || "Nuevo movimiento";
  pantalla.ventanaRegistro.showModal();
}

pantalla.abrirRegistro.addEventListener("click", function () { abrirRegistro(); });

pantalla.botonSueldo.addEventListener("click", function () {
  abrirRegistro({
    tipo: "ingreso",
    categoria: "Sueldo",
    descripcion: "Sueldo de " + nombreMes(mesActual()),
    titulo: "Registrar sueldo"
  });
  pantalla.fecha.value = hoyTexto();
});

pantalla.cerrarRegistro.addEventListener("click", function () {
  pantalla.ventanaRegistro.close();
});

// Tocar fuera del formulario también lo cierra.
pantalla.ventanaRegistro.addEventListener("click", function (evento) {
  if (evento.target !== pantalla.ventanaRegistro) return;
  const caja = pantalla.ventanaRegistro.getBoundingClientRect();
  const fuera = evento.clientX < caja.left || evento.clientX > caja.right ||
                evento.clientY < caja.top || evento.clientY > caja.bottom;
  if (fuera) pantalla.ventanaRegistro.close();
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

  const tipo = tipoElegido();
  movimientos.push({
    id: crearId(),
    tipo: tipo,
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

  pantalla.monto.value = "";
  pantalla.descripcion.value = "";
  pantalla.ventanaRegistro.close();
  actualizarPantalla();
  mostrarAviso(tipo === "ahorro" ? "¡Bien! Apartaste " + formatearDinero(monto) + " 🐷" : "Guardado ✓");
});


/* ---------- 15. Eliminar movimientos ---------- */

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

pantalla.lista.addEventListener("click", alTocarLista);
pantalla.listaProgreso.addEventListener("click", alTocarLista);


/* ---------- 16. Actualizar todo y abrir la app ---------- */

function actualizarPantalla() {
  actualizarSaludo();
  actualizarMoneda();
  pantalla.moneda.value = ajustes.moneda;
  actualizarResumen();
  dibujarLista(mesActual(), pantalla.lista, pantalla.contador, pantalla.vacio);
  if (!pantalla.vistas.progreso.hidden) actualizarProgreso();
  if (!pantalla.vistas.plan.hidden) actualizarPlan();
}

pantalla.fecha.value = hoyTexto();
llenarCategorias();
actualizarPantalla();