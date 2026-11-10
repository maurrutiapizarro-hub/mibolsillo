/* =========================================================
   Mi Bolsillo · app.js
   Aquí está el funcionamiento: guardar, calcular y mostrar.
   ========================================================= */
"use strict";

/* ---------- 1. Configuración ---------- */

// Nombres con los que se guardan los datos en el navegador.
const CLAVE_MOVIMIENTOS = "misMovimientos"; // (el mismo de antes, así no pierdes nada)
const CLAVE_AJUSTES = "miBolsilloAjustes";
const CLAVE_DEUDAS = "miBolsilloDeudas";
const CLAVE_METAS = "miBolsilloMetas";

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
  }
};

// Planes para repartir el dinero (porcentajes de lo que entra cada mes).
// "extra" en el plan Ramsey va al paso en que estás: fondo de emergencia o deudas.
const PLANES = {
  "503020": {
    nombre: "50/30/20",
    descripcion: "Equilibrado. 50% necesidades, 30% gustos y 20% para ahorrar y pagar deudas.",
    reparto: { necesidades: 50, gustos: 30, deudas: 10, ahorro: 10 }
  },
  "702010": {
    nombre: "70/20/10",
    descripcion: "Flexible. 70% para vivir (necesidades y gustos), 20% ahorro y 10% deudas.",
    reparto: { necesidades: 50, gustos: 20, deudas: 10, ahorro: 20 }
  },
  "ramsey": {
    nombre: "Salir de deudas",
    descripcion: "Intenso, al estilo Dave Ramsey. Gustos al mínimo y el 35% al paso en que estás: fondo de emergencia o deudas.",
    reparto: { necesidades: 55, gustos: 10, extra: 35 }
  },
  "personalizado": {
    nombre: "Personalizado",
    descripcion: "Tú decides los porcentajes.",
    reparto: null
  }
};

const GRUPOS = [
  { clave: "necesidades", nombre: "Necesidades", color: "var(--color-necesidades)" },
  { clave: "gustos", nombre: "Gustos", color: "var(--color-gustos)" },
  { clave: "deudas", nombre: "Deudas", color: "var(--color-deudas)" },
  { clave: "ahorro", nombre: "Ahorro", color: "var(--color-ahorro)" }
];

// Íconos para elegir en las metas de ahorro.
const ICONOS_META = ["🎯", "💍", "🏠", "✈️", "🚗", "🎓", "💻", "🎁", "📈", "🐷"];

// Un ícono para cada categoría.
const ICONOS = {
  "Alimentación": "🛒", "Vivienda": "🏠", "Cuentas": "💡", "Transporte": "🚌",
  "Salud": "💊", "Educación": "📚", "Restaurantes": "🍽️", "Entretenimiento": "🎬",
  "Compras": "🛍️", "Viajes": "✈️", "Sueldo": "💼", "Ventas": "🏷️", "Regalos": "🎁",
  "Ahorro": "🐷", "Ahorro general": "🐷", "Emergencias": "🛟", "Metas": "🎯", "Inversión": "📈", "Otros": "📦"
};

// Tipos de deuda. Las hipotecarias no entran en la bola de nieve (se pagan aparte).
const TIPOS_DEUDA = {
  tarjeta: { nombre: "Tarjeta de crédito", icono: "💳" },
  consumo: { nombre: "Crédito de consumo", icono: "🏦" },
  linea: { nombre: "Línea de crédito", icono: "🧾" },
  hipotecario: { nombre: "Hipotecario", icono: "🏠" },
  otro: { nombre: "Otra", icono: "📄" }
};

// Texto de ayuda bajo el selector de tipo.
const AYUDA_TIPO = {
  gasto: "Dinero que usaste: compras, cuentas, salidas…",
  ingreso: "Dinero que recibiste: sueldo, ventas, regalos…",
  ahorro: "Dinero que apartas. Baja tu disponible, pero no cuenta como gasto.",
  deuda: "Pago a una de tus deudas. Baja su saldo y tu disponible."
};

const formatoDia = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long" });
const formatoMes = new Intl.DateTimeFormat("es-CL", { month: "long" });
const formatoMesCorto = new Intl.DateTimeFormat("es-CL", { month: "short" });
const formatoMesAnio = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" });


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
    ahorro: buscar("vista-ahorro"),
    deudas: buscar("vista-deudas"),
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
  filaDeudas: buscar("fila-deudas"),
  filaDeudasTotal: buscar("fila-deudas-total"),
  filaDeudasFoco: buscar("fila-deudas-foco"),
  abrirAjustes: buscar("abrir-ajustes"),
  bloquePresupuesto: buscar("bloque-presupuesto"),
  cambiarPlan: buscar("cambiar-plan"),
  nombrePlanChico: buscar("nombre-plan-chico"),
  basePresupuesto: buscar("base-presupuesto"),
  presupuesto: buscar("presupuesto"),

  // Ahorro
  ahorradoMes: buscar("ahorrado-mes"),
  ahorroSugerido: buscar("ahorro-sugerido"),
  agregarMeta: buscar("agregar-meta"),
  listaMetas: buscar("lista-metas"),
  simuladorMeta: buscar("simulador-meta"),
  simulacionMeta: buscar("simulacion-meta"),
  ventanaMeta: buscar("ventana-meta"),
  formularioMeta: buscar("formulario-meta"),
  tituloMeta: buscar("titulo-meta"),
  cerrarMeta: buscar("cerrar-meta"),
  metaNombre: buscar("meta-nombre"),
  metaIcono: buscar("meta-icono"),
  metaObjetivo: buscar("meta-objetivo"),
  metaAporte: buscar("meta-aporte"),
  errorMeta: buscar("error-meta"),
  eliminarMeta: buscar("eliminar-meta"),

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
  sinDeudas: buscar("sin-deudas"),
  descripcionOpcional: buscar("descripcion-opcional"),
  fecha: buscar("fecha"),
  error: buscar("error"),

  // Progreso
  periodoAnterior: buscar("periodo-anterior"),
  periodoSiguiente: buscar("periodo-siguiente"),
  tituloPeriodo: buscar("titulo-periodo"),
  progresoIngresos: buscar("progreso-ingresos"),
  progresoGastos: buscar("progreso-gastos"),
  progresoAhorro: buscar("progreso-ahorro"),
  progresoDeudas: buscar("progreso-deudas"),
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

  // Deudas
  deudaTotal: buscar("deuda-total"),
  deudaAvanceBarra: buscar("deuda-avance-barra"),
  deudaAvanceTexto: buscar("deuda-avance-texto"),
  deudaLibre: buscar("deuda-libre"),
  bloquePlanDeudas: buscar("bloque-plan-deudas"),
  ayudaMetodo: buscar("ayuda-metodo"),
  presupuestoDeudas: buscar("presupuesto-deudas"),
  ayudaPresupuesto: buscar("ayuda-presupuesto"),
  usarPlanDeudas: buscar("usar-plan-deudas"),
  resultadoPlan: buscar("resultado-plan"),
  agregarDeuda: buscar("agregar-deuda"),
  listaDeudas: buscar("lista-deudas"),
  deudasVacio: buscar("deudas-vacio"),
  ventanaDeuda: buscar("ventana-deuda"),
  formularioDeuda: buscar("formulario-deuda"),
  tituloDeuda: buscar("titulo-deuda"),
  cerrarDeuda: buscar("cerrar-deuda"),
  deudaNombre: buscar("deuda-nombre"),
  deudaTipo: buscar("deuda-tipo"),
  deudaSaldo: buscar("deuda-saldo"),
  deudaCuota: buscar("deuda-cuota"),
  deudaTasa: buscar("deuda-tasa"),
  errorDeuda: buscar("error-deuda"),
  eliminarDeuda: buscar("eliminar-deuda"),

  // Mi plan
  planes: buscar("planes"),
  planPersonal: buscar("plan-personal"),
  sumaPorcentajes: buscar("suma-porcentajes"),
  graficoEvolucion: buscar("grafico-evolucion"),
  detalleEvolucion: buscar("detalle-evolucion"),
  pasos: buscar("pasos"),
  totalAhorrado: buscar("total-ahorrado"),
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
  descargarExcel: buscar("descargar-excel"),
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

// "2028-07" → "julio de 2028"
function nombreMesLargo(mes) {
  return formatoMesAnio.format(textoAFecha(mes + "-01"));
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

// 15000 → "15.000" (para escribir un monto dentro de un campo)
function montoATexto(numero) {
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: decimalesMoneda() }).format(Math.round(numero * 100) / 100);
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
    ["gasto", "ingreso", "ahorro", "deuda"].includes(m.tipo) &&
    Number.isFinite(Number(m.monto)) && Number(m.monto) > 0 &&
    typeof m.descripcion === "string" && m.descripcion.trim() !== "" &&
    /^\d{4}-\d{2}-\d{2}$/.test(m.fecha);
}

function limpiarMovimientos(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.filter(esMovimientoValido).map(function (m, posicion) {
    const limpio = {
      id: m.id || crearId(),
      tipo: m.tipo,
      monto: Number(m.monto),
      descripcion: m.descripcion.trim(),
      categoria: m.categoria || "Otros",
      fecha: m.fecha,
      creado: m.creado || posicion
    };
    if (m.tipo === "deuda") limpio.deudaId = m.deudaId || "";
    if (m.tipo === "ahorro") {
      // Los ahorros antiguos en "Emergencias" pasan a la meta Fondo de emergencia.
      limpio.metaId = m.metaId || (m.categoria === "Emergencias" ? "emergencias" : "");
    }
    return limpio;
  });
}

// Cada deuda guarda una "base": el saldo + lo que ya se le pagó dentro de la app.
// Así, saldo = base − pagos. Al anotar un pago, el saldo baja solo.
function limpiarDeudas(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.filter(function (d) {
    return d && typeof d.nombre === "string" && d.nombre.trim() !== "" && Number(d.base) >= 0;
  }).map(function (d, posicion) {
    return {
      id: d.id || crearId(),
      nombre: d.nombre.trim(),
      tipo: TIPOS_DEUDA[d.tipo] ? d.tipo : "otro",
      base: Number(d.base) || 0,
      cuota: Number(d.cuota) > 0 ? Number(d.cuota) : 0,
      tasa: Number(d.tasa) > 0 ? Number(d.tasa) : 0,
      creado: d.creado || posicion
    };
  });
}

// Metas de ahorro. "emergencias" siempre existe: es el fondo de emergencia.
function limpiarMetas(lista, metaFondo) {
  const metas = (Array.isArray(lista) ? lista : []).filter(function (m) {
    return m && typeof m.nombre === "string" && m.nombre.trim() !== "";
  }).map(function (m, posicion) {
    return {
      id: m.id || crearId(),
      nombre: m.nombre.trim(),
      icono: m.icono || "🎯",
      objetivo: Number(m.objetivo) > 0 ? Number(m.objetivo) : 0,
      aporte: Number(m.aporte) > 0 ? Number(m.aporte) : 0,
      creado: m.creado || posicion
    };
  });
  if (!metas.some(function (m) { return m.id === "emergencias"; })) {
    metas.unshift({ id: "emergencias", nombre: "Fondo de emergencia", icono: "🛟", objetivo: metaFondo, aporte: 0, creado: 0 });
  }
  return metas;
}

function cargarAjustes() {
  const guardados = leerGuardado(CLAVE_AJUSTES, {});
  const moneda = MONEDAS[guardados.moneda] ? guardados.moneda : "CLP";
  return {
    moneda: moneda,
    metaFondo: Number(guardados.metaFondo) > 0 ? Number(guardados.metaFondo) : (moneda === "CLP" ? 1000000 : 1000),
    presupuestoDeudas: Number(guardados.presupuestoDeudas) > 0 ? Number(guardados.presupuestoDeudas) : 0,
    metodoDeudas: guardados.metodoDeudas === "avalancha" ? "avalancha" : "bola",
    plan: PLANES[guardados.plan] ? guardados.plan : "503020",
    planPersonal: guardados.planPersonal || { necesidades: 50, gustos: 30, deudas: 10, ahorro: 10 },
    saldosIniciales: guardados.saldosIniciales || {}
  };
}

function guardarMovimientos() {
  return escribirGuardado(CLAVE_MOVIMIENTOS, movimientos);
}

function guardarAjustes() {
  return escribirGuardado(CLAVE_AJUSTES, {
    moneda: ajustes.moneda,
    metaFondo: ajustes.metaFondo,
    presupuestoDeudas: ajustes.presupuestoDeudas,
    metodoDeudas: ajustes.metodoDeudas,
    plan: ajustes.plan,
    planPersonal: ajustes.planPersonal
  });
}

function guardarMetas() {
  return escribirGuardado(CLAVE_METAS, metas);
}

function guardarDeudas() {
  return escribirGuardado(CLAVE_DEUDAS, deudas);
}

let ajustes = cargarAjustes();
let movimientos = limpiarMovimientos(leerGuardado(CLAVE_MOVIMIENTOS, []));
let deudas = limpiarDeudas(leerGuardado(CLAVE_DEUDAS, []));
let metas = limpiarMetas(leerGuardado(CLAVE_METAS, []), ajustes.metaFondo);

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
guardarMetas();


/* ---------- 6. Cálculos ---------- */

// ¿La categoría es una necesidad o un gusto?
function grupoDe(categoria) {
  return CATEGORIAS.gasto["Gustos"].includes(categoria) ? "gustos" : "necesidades";
}

// Totales de un periodo. El periodo puede ser un mes ("2026-10") o un año ("2026").
function totalesDe(periodo) {
  const t = { ingresos: 0, gastos: 0, necesidades: 0, gustos: 0, ahorro: 0, deudas: 0 };
  movimientos.forEach(function (m) {
    if (!m.fecha.startsWith(periodo)) return;
    if (m.tipo === "ingreso") t.ingresos += m.monto;
    if (m.tipo === "ahorro") t.ahorro += m.monto;
    if (m.tipo === "deuda") t.deudas += m.monto;
    if (m.tipo === "gasto") {
      t.gastos += m.monto;
      t[grupoDe(m.categoria)] += m.monto;
    }
  });
  t.libre = t.ingresos - t.gastos - t.ahorro - t.deudas;
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

// Lo ahorrado en una meta ("" = ahorro general, sin meta).
function aportadoA(metaId, hasta) {
  return movimientos.reduce(function (total, m) {
    if (m.tipo !== "ahorro" || (m.metaId || "") !== metaId) return total;
    if (hasta && mesDe(m.fecha) > hasta) return total;
    return total + m.monto;
  }, 0);
}

function buscarMeta(id) {
  return metas.find(function (m) { return m.id === id; }) || null;
}

// El fondo de emergencia (primer y tercer paso de "Tu camino").
function fondoEmergencia() {
  return aportadoA("emergencias");
}

function metaFondo() {
  const meta = buscarMeta("emergencias");
  return meta && meta.objetivo > 0 ? meta.objetivo : (ajustes.moneda === "CLP" ? 1000000 : 1000);
}

// Ingreso de referencia para el presupuesto: lo que entró este mes o, si aún no hay, tu promedio.
function ingresoBase() {
  const delMes = totalesDe(mesActual()).ingresos;
  if (delMes > 0) return { monto: delMes, origen: "mes" };
  const p = calcularPromedio();
  return p ? { monto: p.ingresos, origen: "promedio" } : { monto: 0, origen: "" };
}

// Paso actual de "Tu camino": 1 fondo inicial, 2 deudas, 3 fondo completo.
function pasoActual() {
  if (fondoEmergencia() < metaFondo()) return 1;
  const pendiente = deudas.reduce(function (s, d) { return d.tipo !== "hipotecario" ? s + saldoDe(d) : s; }, 0);
  if (pendiente > 0) return 2;
  return 3;
}

// Porcentajes del plan elegido: { necesidades, gustos, deudas, ahorro }.
function repartoPlan() {
  if (ajustes.plan === "personalizado") return ajustes.planPersonal;
  const r = PLANES[ajustes.plan].reparto;
  if (r.extra === undefined) return r;
  const vaADeudas = pasoActual() === 2;
  return { necesidades: r.necesidades, gustos: r.gustos, deudas: vaADeudas ? r.extra : 0, ahorro: vaADeudas ? 0 : r.extra };
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

  actualizarPresupuesto();

  // Resumen de deudas
  pantalla.filaDeudas.hidden = deudas.length === 0;
  if (deudas.length) {
    const foco = deudaFoco();
    pantalla.filaDeudasTotal.textContent = formatearDinero(totalDeudas()) + " por pagar en deudas";
    pantalla.filaDeudasFoco.textContent = foco
      ? "Foco ahora: " + foco.nombre + " (" + formatearDinero(saldoDe(foco)) + ")"
      : "¡No te quedan deudas por pagar! 🎉";
  }
}

// "Tu presupuesto del mes": cuánto puedes usar en cada grupo según tu plan.
function actualizarPresupuesto() {
  const base = ingresoBase();
  pantalla.bloquePresupuesto.hidden = base.monto <= 0;
  pantalla.nombrePlanChico.textContent = PLANES[ajustes.plan].nombre;
  if (base.monto <= 0) return;

  const reparto = repartoPlan();
  const t = totalesDe(mesActual());
  pantalla.basePresupuesto.textContent = base.origen === "mes"
    ? "Calculado sobre lo que entró este mes (" + formatearDinero(base.monto) + ")."
    : "Aún no registras ingresos este mes: usamos tu promedio (" + formatearDinero(base.monto) + ").";

  pantalla.presupuesto.innerHTML = "";
  GRUPOS.forEach(function (g) {
    const limite = base.monto * (reparto[g.clave] || 0) / 100;
    const usado = t[g.clave];
    if (limite <= 0 && usado <= 0) return;
    const esMeta = g.clave === "ahorro" || g.clave === "deudas";

    const li = crear("li");
    const arriba = crear("div", "presupuesto-arriba");
    const monto = crear("span", "presupuesto-monto");
    monto.append(crear("strong", "", formatearDinero(usado)), " de " + formatearDinero(limite));
    arriba.append(crear("span", "presupuesto-nombre", g.nombre + " · " + (reparto[g.clave] || 0) + "%"), monto);

    const barra = crear("div", "presupuesto-barra");
    const relleno = crear("span");
    relleno.style.width = Math.min(limite > 0 ? usado / limite * 100 : 100, 100) + "%";
    relleno.style.background = !esMeta && usado > limite ? "var(--rojo)" : g.color;
    barra.appendChild(relleno);

    let nota, clase = "";
    if (esMeta) {
      if (usado >= limite) { nota = "¡Cumpliste lo de este mes!"; clase = "logrado"; }
      else nota = "Te faltan " + formatearDinero(limite - usado) + (g.clave === "ahorro" ? " por apartar." : " por pagar.");
    } else if (usado > limite) {
      nota = "Te pasaste por " + formatearDinero(usado - limite) + "."; clase = "pasado";
    } else {
      nota = "Te quedan " + formatearDinero(limite - usado) + ".";
    }
    li.append(arriba, barra, crear("span", "presupuesto-nota " + clase, nota));
    pantalla.presupuesto.appendChild(li);
  });
}

function crearFilaMovimiento(m) {
  const fila = crear("li", "movimiento");

  const deuda = m.tipo === "deuda" ? buscarDeuda(m.deudaId) : null;
  const metaMov = m.tipo === "ahorro" ? buscarMeta(m.metaId) : null;
  const simbolo = m.tipo === "deuda"
    ? (deuda ? TIPOS_DEUDA[deuda.tipo].icono : "💳")
    : m.tipo === "ahorro" ? (metaMov ? metaMov.icono : "🐷")
    : (ICONOS[m.categoria] || "📦");
  const icono = crear("span", "icono " + m.tipo, simbolo);
  icono.setAttribute("aria-hidden", "true");

  const info = crear("div", "info");
  info.appendChild(crear("strong", "", m.descripcion));
  let detalle = m.categoria;
  if (m.tipo === "gasto") detalle += grupoDe(m.categoria) === "gustos" ? " · Gusto" : " · Necesidad";
  if (m.tipo === "ahorro") {
    const meta = buscarMeta(m.metaId);
    detalle = "Ahorro · " + (meta ? meta.nombre : "Ahorro general");
  }
  if (m.tipo === "deuda") detalle = "Pago de deuda · " + (deuda ? deuda.nombre : m.categoria);
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
  pantalla.progresoDeudas.textContent = formatearDinero(t.deudas);
  pantalla.progresoLibre.textContent = formatearDinero(t.libre);
  pantalla.progresoLibre.classList.toggle("negativo", t.libre < 0);
}

// Barra dividida: necesidades, gustos, ahorro y lo que quedó libre.
function actualizarReparto() {
  const t = totalesDe(periodo);
  const base = Math.max(t.ingresos, t.gastos + t.ahorro + t.deudas);
  pantalla.reparto.innerHTML = "";
  pantalla.repartoLeyenda.innerHTML = "";
  pantalla.repartoVacio.hidden = t.ingresos > 0;
  pantalla.reparto.hidden = base === 0;

  const partes = [
    { clave: "necesidades", nombre: "Necesidades", valor: t.necesidades, color: "var(--color-necesidades)" },
    { clave: "gustos", nombre: "Gustos", valor: t.gustos, color: "var(--color-gustos)" },
    { clave: "deudas", nombre: "Deudas", valor: t.deudas, color: "var(--color-deudas)" },
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
    ", pagaste " + formatearDinero(t.deudas) + " en deudas y ahorraste " + formatearDinero(t.ahorro) + ". "
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

  const p = { ingresos: 0, necesidades: 0, gustos: 0, ahorro: 0, deudas: 0, meses: meses };
  meses.forEach(function (m) {
    const t = totalesDe(m);
    p.ingresos += t.ingresos / meses.length;
    p.necesidades += t.necesidades / meses.length;
    p.gustos += t.gustos / meses.length;
    p.ahorro += t.ahorro / meses.length;
    p.deudas += t.deudas / meses.length;
  });
  p.libre = p.ingresos - p.necesidades - p.gustos - p.ahorro - p.deudas;
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

// "Tu camino": 1) fondo inicial, 2) salir de deudas, 3) fondo completo.
function actualizarPasos(p) {
  const fondo = fondoEmergencia();
  const meta1 = metaFondo();
  const sinHipoteca = deudas.filter(function (d) { return d.tipo !== "hipotecario"; });
  const totalOriginal = sinHipoteca.reduce(function (s, d) { return s + d.base; }, 0);
  const pendiente = sinHipoteca.reduce(function (s, d) { return s + saldoDe(d); }, 0);
  const necesidadesMes = p && p.necesidades > 0 ? p.necesidades : meta1;
  const meta3 = necesidadesMes * 3;

  const pasos = [
    {
      titulo: "Fondo de emergencia inicial",
      listo: fondo >= meta1,
      avance: Math.min(fondo / meta1, 1),
      texto: "Llevas " + formatearDinero(fondo) + " de " + formatearDinero(meta1) + " en tu Fondo de emergencia."
    },
    {
      titulo: "Pagar tus deudas",
      listo: pendiente <= 0,
      avance: totalOriginal > 0 ? (totalOriginal - pendiente) / totalOriginal : (deudas.length ? 1 : 0),
      texto: totalOriginal > 0
        ? (pendiente > 0 ? "Te quedan " + formatearDinero(pendiente) + ". Foco: " + (deudaFoco() ? deudaFoco().nombre : "—") + "." : "¡Pagaste todas tus deudas!")
        : "Si no tienes deudas (sin contar la hipotecaria), este paso está listo."
    },
    {
      titulo: "Fondo de emergencia completo",
      listo: fondo >= meta3,
      avance: Math.min(fondo / meta3, 1),
      texto: "3 a 6 meses de tus necesidades: entre " + formatearDinero(meta3) + " y " + formatearDinero(meta3 * 2) + "."
    }
  ];

  let actualMarcado = false;
  pantalla.pasos.innerHTML = "";
  pasos.forEach(function (paso) {
    const li = crear("li", "paso");
    if (paso.listo) li.classList.add("listo");
    else if (!actualMarcado) { li.classList.add("actual"); actualMarcado = true; }
    li.append(crear("strong", "", paso.titulo), crear("span", "paso-texto", paso.texto));
    if (!paso.listo) {
      const barra = crear("div", "paso-barra");
      const relleno = crear("span");
      relleno.style.width = Math.round(paso.avance * 100) + "%";
      barra.appendChild(relleno);
      li.appendChild(barra);
    }
    pantalla.pasos.appendChild(li);
  });
}

function actualizarPlan() {
  const p = calcularPromedio();
  dibujarPlanes();
  actualizarPasos(p);
  actualizarEvolucion();
  pantalla.planSinDatos.hidden = p !== null;
  pantalla.planConDatos.hidden = p === null;
  if (!p) return;

  const f = formatearDinero;
  const nombresMeses = p.meses.slice().reverse().map(nombreMes);
  pantalla.planBase.textContent = p.meses.length === 1
    ? "Tu plan: " + PLANES[ajustes.plan].nombre + ". Calculado con " + nombresMeses[0] + "; mientras más meses registres, más preciso será."
    : "Tu plan: " + PLANES[ajustes.plan].nombre + ". Promedio de " + nombresMeses.slice(0, -1).join(", ") + " y " + nombresMeses[nombresMeses.length - 1] + ".";

  // Promedios
  pantalla.promedios.innerHTML = "";
  [
    ["Entra", p.ingresos],
    ["Necesidades", p.necesidades],
    ["Gustos", p.gustos],
    ["Pagos de deudas", p.deudas],
    ["Ahorro", p.ahorro],
    ["Te queda libre", p.libre]
  ].forEach(function (fila, i) {
    const li = crear("li");
    li.append(crear("span", "", fila[0]), crear("span", "valor" + (i === 5 ? " destacado" : ""), f(fila[1])));
    pantalla.promedios.appendChild(li);
  });

  // Comparación con tu plan
  const reparto = repartoPlan();
  pantalla.comparacion.innerHTML = "";
  GRUPOS.forEach(function (g) {
    const tuyo = Math.round(p[g.clave] / p.ingresos * 100);
    const ref = reparto[g.clave] || 0;
    const li = crear("li");
    const arriba = crear("div", "comparacion-arriba");
    arriba.append(
      crear("span", "comparacion-nombre", g.nombre),
      crear("span", "comparacion-tuyo", "Tú: " + tuyo + "%"),
      crear("span", "comparacion-ref", "· plan " + ref + "%")
    );
    const barra = crear("div", "comparacion-barra");
    const relleno = crear("span", "relleno");
    relleno.style.width = Math.min(tuyo, 100) + "%";
    relleno.style.background = g.color;
    const marca = crear("span", "marca-ref");
    marca.style.left = Math.min(ref, 100) + "%";
    marca.title = "Tu plan: " + ref + "%";
    barra.append(relleno, marca);
    li.append(arriba, barra);
    pantalla.comparacion.appendChild(li);
  });

  // Propuestas basadas en tus números
  pantalla.propuestas.innerHTML = "";
  const tasaAhorro = p.ahorro / p.ingresos;
  const metaGustos = (reparto.gustos || 0) / 100;
  const metaAhorro = (reparto.ahorro || 0) / 100;

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

  if (p.gustos / p.ingresos > metaGustos) {
    const exceso = p.gustos - p.ingresos * metaGustos;
    agregarPropuesta("🎯", [
      "Tus gustos son el ", { fuerte: Math.round(p.gustos / p.ingresos * 100) + "%" }, " de lo que entra. Si los llevas al " + Math.round(metaGustos * 100) + "% de tu plan, liberarías ",
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

  if (metaAhorro > 0 && tasaAhorro >= metaAhorro) {
    agregarPropuesta("🌱", [
      "¡Vas muy bien! Apartas el ", { fuerte: Math.round(tasaAhorro * 100) + "%" }, " de lo que entra, igual o más que el " + Math.round(metaAhorro * 100) + "% de tu plan."
    ]);
  } else if (metaAhorro > 0) {
    agregarPropuesta("🐷", [
      "Hoy apartas el ", { fuerte: Math.round(tasaAhorro * 100) + "%" }, " de lo que entra. Tu plan propone " + Math.round(metaAhorro * 100) + "%: ",
      { fuerte: f(p.ingresos * metaAhorro) }, " al mes (", { fuerte: f(Math.max(p.ingresos * metaAhorro - p.ahorro, 0)) }, " más que ahora)."
    ]);
  }

  // Propuesta conectada con tus deudas
  if (totalDeudas() > 0) {
    const presupuesto = presupuestoDeudas();
    const actual = simularDeudas(presupuesto);
    const conLibre = p.libre > 0 ? simularDeudas(presupuesto + p.libre) : null;
    if (actual && actual.meses && conLibre && conLibre.meses && conLibre.meses < actual.meses) {
      agregarPropuesta("💳", [
        "Con ", { fuerte: f(presupuesto) }, " al mes para deudas quedarías libre en ", { fuerte: nombreMesLargo(moverMes(mesActual(), actual.meses)) },
        ". Si sumas lo que te queda libre (", { fuerte: f(p.libre) }, "), sería en ", { fuerte: nombreMesLargo(moverMes(mesActual(), conLibre.meses)) },
        ": ", { fuerte: (actual.meses - conLibre.meses) + " meses antes" }, "."
      ]);
    } else if (actual && actual.meses) {
      agregarPropuesta("💳", [
        "Con ", { fuerte: f(presupuesto) }, " al mes para deudas quedarías libre en ", { fuerte: nombreMesLargo(moverMes(mesActual(), actual.meses)) }, "."
      ]);
    }
  }

  if (p.necesidades > 0) {
    agregarPropuesta("🛟", [
      "Un fondo de emergencia suele cubrir de 3 a 6 meses de necesidades. Para ti serían entre ",
      { fuerte: f(p.necesidades * 3) }, " y ", { fuerte: f(p.necesidades * 6) }, ". Llevas ",
      { fuerte: f(fondoEmergencia()) }, " en tu Fondo de emergencia."
    ]);
  }
}

// ----- Elegir plan -----

function dibujarPlanes() {
  pantalla.planes.innerHTML = "";
  Object.keys(PLANES).forEach(function (clave) {
    const plan = PLANES[clave];
    const opcion = crear("label", "plan-opcion");
    const radio = crear("input");
    radio.type = "radio";
    radio.name = "plan";
    radio.value = clave;
    radio.checked = clave === ajustes.plan;
    const caja = crear("span", "plan-caja");
    caja.append(crear("strong", "", plan.nombre), crear("span", "", plan.descripcion));

    // Mini barra con el reparto del plan
    const r = clave === ajustes.plan ? repartoPlan() : (plan.reparto && plan.reparto.extra === undefined ? plan.reparto : (clave === "personalizado" ? ajustes.planPersonal : { necesidades: 55, gustos: 10, deudas: 35, ahorro: 0 }));
    const mini = crear("span", "plan-mini");
    GRUPOS.forEach(function (g) {
      if (!r[g.clave]) return;
      const tramo = crear("i");
      tramo.style.width = r[g.clave] + "%";
      tramo.style.background = g.color;
      tramo.title = g.nombre + " " + r[g.clave] + "%";
      mini.appendChild(tramo);
    });
    caja.appendChild(mini);
    opcion.append(radio, caja);
    pantalla.planes.appendChild(opcion);
  });

  pantalla.planPersonal.hidden = ajustes.plan !== "personalizado";
  GRUPOS.forEach(function (g) {
    const campo = buscar("pct-" + g.clave);
    if (document.activeElement !== campo) campo.value = ajustes.planPersonal[g.clave] || 0;
  });
  mostrarSumaPorcentajes();
}

function mostrarSumaPorcentajes() {
  const suma = GRUPOS.reduce(function (s, g) { return s + (Number(ajustes.planPersonal[g.clave]) || 0); }, 0);
  pantalla.sumaPorcentajes.textContent = suma === 100 ? "Suma 100% ✓" : "Suma " + suma + "%: ajústalo para que llegue a 100%.";
  pantalla.sumaPorcentajes.classList.toggle("mal", suma !== 100);
}

pantalla.planes.addEventListener("change", function (evento) {
  if (evento.target.name !== "plan") return;
  ajustes.plan = evento.target.value;
  guardarAjustes();
  actualizarPantalla();
  mostrarAviso("Plan " + PLANES[ajustes.plan].nombre + " activado ✓");
});

GRUPOS.forEach(function (g) {
  const campo = buscar("pct-" + g.clave);
  campo.addEventListener("input", function () {
    campo.value = campo.value.replace(/\D/g, "").slice(0, 3);
    ajustes.planPersonal[g.clave] = Math.min(Number(campo.value) || 0, 100);
    guardarAjustes();
    mostrarSumaPorcentajes();
    actualizarResumen();
  });
  campo.addEventListener("change", function () { actualizarPantalla(); });
});

// ----- Tu evolución: deuda restante y ahorro acumulado, últimos 12 meses -----

function deudaRestanteAl(mes) {
  return deudas.reduce(function (total, d) {
    const pagadoHasta = movimientos.reduce(function (s, m) {
      return m.tipo === "deuda" && m.deudaId === d.id && mesDe(m.fecha) <= mes ? s + m.monto : s;
    }, 0);
    return total + Math.max(d.base - pagadoHasta, 0);
  }, 0);
}

function ahorroAcumuladoAl(mes) {
  return movimientos.reduce(function (s, m) {
    return m.tipo === "ahorro" && mesDe(m.fecha) <= mes ? s + m.monto : s;
  }, 0);
}

function mostrarDetalleEvolucion(mes) {
  const deuda = deudaRestanteAl(mes);
  const ahorro = ahorroAcumuladoAl(mes);
  pantalla.detalleEvolucion.innerHTML = "";
  pantalla.detalleEvolucion.append(
    crear("strong", "", nombreMesConAnio(mes) + ": "),
    "debías " + formatearDinero(deuda) + " y tenías ahorrados " + formatearDinero(ahorro) +
    ". Tu patrimonio (ahorro menos deuda) era " + formatearDinero(ahorro - deuda) + "."
  );
  pantalla.graficoEvolucion.querySelectorAll(".grafico-mes").forEach(function (b) {
    b.classList.toggle("elegido", b.dataset.mes === mes);
  });
}

function actualizarEvolucion() {
  // Desde tu primer registro (máximo los últimos 12 meses).
  const primero = movimientos.reduce(function (min, m) { return mesDe(m.fecha) < min ? mesDe(m.fecha) : min; }, mesActual());
  const meses = [mesActual()];
  while (meses.length < 12 && meses[0] > primero) meses.unshift(moverMes(meses[0], -1));
  pantalla.graficoEvolucion.style.gridTemplateColumns = "repeat(" + Math.max(meses.length, 6) + ", 1fr)";
  const datos = meses.map(function (mes) { return { mes: mes, deuda: deudaRestanteAl(mes), ahorro: ahorroAcumuladoAl(mes) }; });
  const maximo = Math.max(1, ...datos.map(function (d) { return Math.max(d.deuda, d.ahorro); }));

  pantalla.graficoEvolucion.innerHTML = "";
  datos.forEach(function (d) {
    const boton = crear("button", "grafico-mes");
    boton.type = "button";
    boton.dataset.mes = d.mes;
    boton.setAttribute("aria-label", nombreMesConAnio(d.mes) + ": deuda " + formatearDinero(d.deuda) + ", ahorro " + formatearDinero(d.ahorro));
    const barras = crear("div", "grafico-barras");
    const deuda = crear("span", "grafico-barra");
    deuda.style.height = (d.deuda / maximo * 100) + "%";
    deuda.style.background = "var(--color-deudas)";
    const ahorro = crear("span", "grafico-barra");
    ahorro.style.height = (d.ahorro / maximo * 100) + "%";
    ahorro.style.background = "var(--color-ahorro)";
    barras.append(deuda, ahorro);
    boton.append(barras, crear("span", "grafico-etiqueta", formatoMesCorto.format(textoAFecha(d.mes + "-01")).replace(".", "").slice(0, 3)));
    boton.addEventListener("click", function () { mostrarDetalleEvolucion(d.mes); });
    pantalla.graficoEvolucion.appendChild(boton);
  });
  mostrarDetalleEvolucion(mesActual());
}


/* ---------- 11. Pestaña Ahorro ---------- */

// Meses para llegar a una meta, con un aporte mensual.
function mesesParaMeta(falta, aporte) {
  if (falta <= 0) return 0;
  if (!(aporte > 0)) return null;
  return Math.ceil(falta / aporte);
}

function actualizarAhorro() {
  const total = totalAhorrado();
  const delMes = totalesDe(mesActual()).ahorro;
  const base = ingresoBase();
  const sugerido = base.monto * (repartoPlan().ahorro || 0) / 100;

  pantalla.totalAhorrado.textContent = formatearDinero(total);
  pantalla.ahorradoMes.textContent = "Este mes apartaste " + formatearDinero(delMes) + ".";
  pantalla.ahorroSugerido.textContent = sugerido > 0
    ? "🎯 Según tu plan " + PLANES[ajustes.plan].nombre + ", este mes apartarías " + formatearDinero(sugerido) +
      (delMes >= sugerido ? " ✓" : " (te faltan " + formatearDinero(sugerido - delMes) + ")")
    : "";

  // Lista de metas
  pantalla.listaMetas.innerHTML = "";
  const paso = pasoActual();
  const filas = metas.slice();
  const general = aportadoA("");
  if (general > 0) filas.push({ id: "", nombre: "Ahorro general", icono: "🐷", objetivo: 0, aporte: 0, general: true });

  filas.forEach(function (meta) {
    const ahorrado = aportadoA(meta.id);
    const falta = Math.max(meta.objetivo - ahorrado, 0);
    const lograda = meta.objetivo > 0 && falta <= 0;
    const li = crear("li", "item-deuda item-meta");
    const esFoco = meta.id === "emergencias" && (paso === 1 || paso === 3) && !lograda;
    if (esFoco) li.classList.add("foco");
    if (lograda) li.classList.add("lograda");

    const arriba = crear("div", "deuda-arriba");
    const icono = crear("span", "icono", meta.icono);
    icono.setAttribute("aria-hidden", "true");
    const info = crear("div", "deuda-info");
    const detalle = crear("span", "", meta.general ? "Ahorros sin meta" :
      (meta.objetivo > 0 ? "Meta: " + formatearDinero(meta.objetivo) : "Sin monto meta"));
    if (esFoco) detalle.prepend(crear("span", "etiqueta-foco", "Tu paso actual"));
    info.append(crear("strong", "", meta.nombre), detalle);
    const saldo = crear("div", "deuda-saldo");
    saldo.append(
      crear("strong", "", formatearDinero(ahorrado)),
      crear("span", "", meta.aporte ? formatearDinero(meta.aporte) + " al mes" : (meta.objetivo > 0 ? Math.round(Math.min(ahorrado / meta.objetivo, 1) * 100) + "%" : ""))
    );
    arriba.append(icono, info, saldo);
    li.appendChild(arriba);

    if (meta.objetivo > 0) {
      const barra = crear("div", "deuda-barra");
      const relleno = crear("span");
      relleno.style.width = Math.round(Math.min(ahorrado / meta.objetivo, 1) * 100) + "%";
      barra.appendChild(relleno);
      li.appendChild(barra);
    }

    const abajo = crear("div", "deuda-abajo");
    let fecha = "";
    if (lograda) fecha = "¡Meta cumplida! 🎉";
    else if (meta.objetivo > 0) {
      const meses = mesesParaMeta(falta, meta.aporte);
      fecha = meses ? "Te faltan " + formatearDinero(falta) + " · llegas en " + nombreMesLargo(moverMes(mesActual(), meses))
        : "Te faltan " + formatearDinero(falta);
    }
    abajo.appendChild(crear("span", "fecha", fecha));
    const aportar = crear("button", "aportar", "Aportar");
    aportar.type = "button";
    aportar.addEventListener("click", function () {
      abrirRegistro({ tipo: "ahorro", categoria: meta.id || "general", monto: meta.aporte || 0, descripcion: "", titulo: "Aportar a " + meta.nombre });
    });
    abajo.appendChild(aportar);
    if (!meta.general) {
      const editar = crear("button", "", "Editar");
      editar.type = "button";
      editar.addEventListener("click", function () { abrirMeta(meta); });
      abajo.appendChild(editar);
    }
    li.appendChild(abajo);
    pantalla.listaMetas.appendChild(li);
  });

  // Sugerencia inicial para el simulador
  if (!pantalla.simulador.value && sugerido > 0) pantalla.simulador.value = montoATexto(Math.round(sugerido));
  actualizarSimulacion();
}

function actualizarSimulacion() {
  const mensual = leerMonto(pantalla.simulador.value) || 0;
  pantalla.simulacion.innerHTML = "";
  [3, 6, 12, 24].forEach(function (meses) {
    const caja = crear("div");
    caja.append(crear("span", "", meses + " meses"), crear("strong", "", formatearDinero(mensual * meses)));
    pantalla.simulacion.appendChild(caja);
  });

  const objetivo = leerMonto(pantalla.simuladorMeta.value) || 0;
  pantalla.simulacionMeta.innerHTML = "";
  if (objetivo > 0 && mensual > 0) {
    const meses = Math.ceil(objetivo / mensual);
    pantalla.simulacionMeta.append(
      "Apartando " + formatearDinero(mensual) + " al mes, juntarías " + formatearDinero(objetivo) + " en ",
      crear("strong", "", meses + (meses === 1 ? " mes" : " meses")),
      " (" + nombreMesLargo(moverMes(mesActual(), meses)) + ")."
    );
  } else if (objetivo > 0) {
    pantalla.simulacionMeta.textContent = "Escribe arriba cuánto apartarías al mes.";
  }
}

[pantalla.simulador, pantalla.simuladorMeta].forEach(function (campo) {
  campo.addEventListener("input", function () {
    formatearMientrasEscribe(campo);
    actualizarSimulacion();
  });
});

// ----- Ventana para crear o editar una meta -----

let metaEditando = null;

function abrirMeta(meta) {
  metaEditando = meta || null;
  pantalla.errorMeta.textContent = "";
  pantalla.tituloMeta.textContent = meta ? "Editar meta" : "Nueva meta";
  pantalla.metaNombre.value = meta ? meta.nombre : "";
  pantalla.metaObjetivo.value = meta && meta.objetivo ? montoATexto(meta.objetivo) : "";
  pantalla.metaAporte.value = meta && meta.aporte ? montoATexto(meta.aporte) : "";
  const icono = meta ? meta.icono : "🎯";
  pantalla.metaIcono.innerHTML = "";
  ICONOS_META.concat(icono === "🛟" ? ["🛟"] : []).forEach(function (i) {
    const opcion = crear("label", "opcion-categoria");
    const radio = crear("input");
    radio.type = "radio";
    radio.name = "icono-meta";
    radio.value = i;
    radio.checked = i === icono;
    opcion.append(radio, crear("span", "", i));
    pantalla.metaIcono.appendChild(opcion);
  });
  pantalla.eliminarMeta.hidden = !meta || meta.id === "emergencias";
  pantalla.ventanaMeta.showModal();
}

pantalla.agregarMeta.addEventListener("click", function () { abrirMeta(null); });
pantalla.cerrarMeta.addEventListener("click", function () { pantalla.ventanaMeta.close(); });
[pantalla.metaObjetivo, pantalla.metaAporte].forEach(function (campo) {
  campo.addEventListener("input", function () { formatearMientrasEscribe(campo); });
});

pantalla.formularioMeta.addEventListener("submit", function (evento) {
  evento.preventDefault();
  const nombre = pantalla.metaNombre.value.trim();
  const objetivo = leerMonto(pantalla.metaObjetivo.value) || 0;
  const aporte = leerMonto(pantalla.metaAporte.value) || 0;
  const icono = (pantalla.formularioMeta.querySelector('input[name="icono-meta"]:checked') || {}).value || "🎯";

  if (!nombre) { pantalla.errorMeta.textContent = "Escribe para qué es esta meta."; return pantalla.metaNombre.focus(); }
  if (!(objetivo > 0)) { pantalla.errorMeta.textContent = "Escribe cuánto necesitas juntar."; return pantalla.metaObjetivo.focus(); }

  if (metaEditando) {
    metaEditando.nombre = nombre;
    metaEditando.objetivo = objetivo;
    metaEditando.aporte = aporte;
    metaEditando.icono = icono;
  } else {
    metas.push({ id: crearId(), nombre: nombre, icono: icono, objetivo: objetivo, aporte: aporte, creado: Date.now() });
  }
  guardarMetas();
  pantalla.ventanaMeta.close();
  actualizarPantalla();
  mostrarAviso(metaEditando ? "Meta actualizada ✓" : "Meta creada ✓");
});

pantalla.eliminarMeta.addEventListener("click", function () {
  if (!metaEditando || metaEditando.id === "emergencias") return;
  if (!window.confirm("¿Eliminar la meta " + metaEditando.nombre + "? Lo que ya ahorraste en ella pasa a Ahorro general.")) return;
  const id = metaEditando.id;
  metas = metas.filter(function (m) { return m.id !== id; });
  movimientos.forEach(function (m) { if (m.tipo === "ahorro" && m.metaId === id) { m.metaId = ""; m.categoria = "Ahorro general"; } });
  guardarMetas();
  guardarMovimientos();
  pantalla.ventanaMeta.close();
  actualizarPantalla();
  mostrarAviso("Meta eliminada");
});


/* ---------- 12. Pestaña Deudas ---------- */

function buscarDeuda(id) {
  return deudas.find(function (d) { return d.id === id; }) || null;
}

// Lo que ya pagaste a una deuda dentro de la app.
function pagadoA(deuda) {
  return movimientos.reduce(function (total, m) {
    return m.tipo === "deuda" && m.deudaId === deuda.id ? total + m.monto : total;
  }, 0);
}

function saldoDe(deuda) {
  return Math.max(Math.round((deuda.base - pagadoA(deuda)) * 100) / 100, 0);
}

function totalDeudas() {
  return deudas.reduce(function (total, d) { return total + saldoDe(d); }, 0);
}

// Orden de pago. Bola de nieve: de la más chica a la más grande.
// Avalancha: de la de mayor interés a la de menor. Las hipotecarias van al final.
function ordenar(lista, saldoDe2) {
  return lista.slice().sort(function (a, b) {
    const hipA = a.tipo === "hipotecario", hipB = b.tipo === "hipotecario";
    if (hipA !== hipB) return hipA ? 1 : -1;
    if (ajustes.metodoDeudas === "avalancha" && a.tasa !== b.tasa) return b.tasa - a.tasa;
    return saldoDe2(a) - saldoDe2(b);
  });
}

function deudasOrdenadas() {
  return ordenar(deudas, saldoDe);
}

// La deuda en la que conviene concentrarse ahora.
function deudaFoco() {
  return deudasOrdenadas().find(function (d) { return saldoDe(d) > 0 && d.tipo !== "hipotecario"; }) || null;
}

function totalCuotas() {
  return deudas.reduce(function (total, d) {
    return saldoDe(d) > 0 && d.tipo !== "hipotecario" ? total + d.cuota : total;
  }, 0);
}

// Lo que tu plan propone destinar a deudas cada mes.
function deudasSegunPlan() {
  return ingresoBase().monto * (repartoPlan().deudas || 0) / 100;
}

// Cuánto se destina a deudas cada mes: lo que escribiste, o lo que dice tu plan.
function presupuestoDeudas() {
  if (ajustes.presupuestoDeudas > 0) return ajustes.presupuestoDeudas;
  const segunPlan = Math.max(deudasSegunPlan(), totalCuotas());
  if (segunPlan > 0) return Math.round(segunPlan);
  const p = calcularPromedio();
  return p ? Math.max(p.deudas, 0) : 0;
}

// Simula mes a mes cómo bajan tus deudas (sin la hipotecaria).
// Cada mes: se suma el interés, se pagan las cuotas mínimas y lo que sobra va a la deuda foco.
// Cuando una deuda se termina, su cuota pasa a la siguiente (por eso "bola de nieve").
function simularDeudas(presupuesto) {
  let lista = ordenar(deudas.filter(function (d) { return d.tipo !== "hipotecario" && saldoDe(d) > 0; }), saldoDe)
    .map(function (d) { return { id: d.id, saldo: saldoDe(d), tasa: d.tasa / 100, cuota: d.cuota }; });
  if (lista.length === 0) return { meses: 0, intereses: 0, fin: {} };
  if (!(presupuesto > 0)) return null;

  const fin = {};
  let intereses = 0;
  for (let mes = 1; mes <= 600; mes++) {
    lista.forEach(function (d) {
      const interes = d.saldo * d.tasa;
      d.saldo += interes;
      intereses += interes;
    });

    const minimos = lista.reduce(function (s, d) { return s + Math.min(d.cuota, d.saldo); }, 0);
    if (minimos > presupuesto + 0.5) return { insuficiente: true, minimos: minimos };

    let disponible = presupuesto;
    lista.forEach(function (d) {
      const pago = Math.min(d.cuota, d.saldo);
      d.saldo -= pago;
      disponible -= pago;
    });
    lista.forEach(function (d) {
      if (disponible <= 0) return;
      const pago = Math.min(disponible, d.saldo);
      d.saldo -= pago;
      disponible -= pago;
    });

    lista.forEach(function (d) { if (d.saldo <= 0.5 && !fin[d.id]) fin[d.id] = mes; });
    lista = lista.filter(function (d) { return d.saldo > 0.5; });
    if (lista.length === 0) return { meses: mes, intereses: intereses, fin: fin };
  }
  return { nunca: true };
}

function actualizarDeudas() {
  const total = totalDeudas();
  const original = deudas.reduce(function (s, d) { return s + d.base; }, 0);
  const pagado = original - total;
  const avance = original > 0 ? pagado / original : 0;

  pantalla.deudaTotal.textContent = formatearDinero(total);
  pantalla.deudaAvanceBarra.style.width = Math.round(avance * 100) + "%";
  pantalla.deudaAvanceTexto.textContent = deudas.length
    ? "Has pagado " + formatearDinero(pagado) + " (" + Math.round(avance * 100) + "%)"
    : "Aún no registras deudas.";

  pantalla.deudasVacio.hidden = deudas.length > 0;
  pantalla.bloquePlanDeudas.hidden = deudas.length === 0;

  // Plan de pago
  buscar("metodo-" + ajustes.metodoDeudas).checked = true;
  pantalla.ayudaMetodo.textContent = ajustes.metodoDeudas === "bola"
    ? "Pagas primero la deuda más chica. Ves avances rápido y eso motiva."
    : "Pagas primero la de mayor interés. Suele costar menos en intereses (necesita la tasa de cada deuda).";

  const presupuesto = presupuestoDeudas();
  if (document.activeElement !== pantalla.presupuestoDeudas) {
    pantalla.presupuestoDeudas.value = presupuesto > 0 ? montoATexto(presupuesto) : "";
  }
  const cuotas = totalCuotas();
  pantalla.ayudaPresupuesto.textContent = cuotas > 0
    ? "La suma de tus cuotas mínimas es " + formatearDinero(cuotas) + ". Todo lo que pongas por sobre eso va a la deuda foco."
    : "Incluye las cuotas que ya pagas más lo extra que puedas sumar.";

  const segunPlan = Math.round(deudasSegunPlan());
  pantalla.usarPlanDeudas.hidden = !(segunPlan > 0 && Math.abs(segunPlan - presupuesto) > 1);
  pantalla.usarPlanDeudas.textContent = "Usar lo de mi plan " + PLANES[ajustes.plan].nombre + ": " + formatearDinero(segunPlan) + " al mes";

  const sim = simularDeudas(presupuesto);
  const faltanTasas = deudas.some(function (d) { return saldoDe(d) > 0 && d.tipo !== "hipotecario" && !d.tasa; });
  pantalla.resultadoPlan.innerHTML = "";
  pantalla.deudaLibre.textContent = "";

  function resultado(clase, partes) {
    const caja = crear("div", "resultado " + clase);
    partes.forEach(function (parte) { caja.append(parte); });
    pantalla.resultadoPlan.appendChild(caja);
  }

  if (deudas.length && total > 0) {
    if (!sim) {
      resultado("alerta", ["Escribe cuánto puedes destinar al mes para calcular tu fecha."]);
    } else if (sim.insuficiente) {
      resultado("alerta", ["Con ese monto no alcanzas a cubrir las cuotas mínimas (" + formatearDinero(sim.minimos) + "). Prueba con un monto mayor."]);
    } else if (sim.nunca) {
      resultado("alerta", ["Con ese monto los intereses crecen más rápido de lo que pagas. Prueba con un monto mayor."]);
    } else if (sim.meses > 0) {
      const finMes = moverMes(mesActual(), sim.meses);
      resultado("", [
        crear("span", "", "Quedarías libre de deudas en"),
        crear("span", "resultado-grande", mayuscula(nombreMesLargo(finMes))),
        crear("span", "", "En " + sim.meses + (sim.meses === 1 ? " mes" : " meses") +
          (sim.intereses > 0 ? ", pagando unos " + formatearDinero(sim.intereses) + " en intereses." : "."))
      ]);
      pantalla.deudaLibre.textContent = "🎯 Libre de deudas en " + nombreMesLargo(finMes);
      if (faltanTasas) {
        resultado("", ["⚠️ Algunas deudas no tienen tasa de interés. Agrégala con “Editar” para que la fecha sea más realista."]);
      }
    }
  }

  // Lista de deudas
  pantalla.listaDeudas.innerHTML = "";
  const foco = deudaFoco();
  deudasOrdenadas().forEach(function (d) {
    const saldo = saldoDe(d);
    const avanceDeuda = d.base > 0 ? (d.base - saldo) / d.base : 1;
    const li = crear("li", "item-deuda");
    if (foco && d.id === foco.id) li.classList.add("foco");
    if (saldo <= 0) li.classList.add("pagada");

    const arriba = crear("div", "deuda-arriba");
    const icono = crear("span", "icono deuda", TIPOS_DEUDA[d.tipo].icono);
    icono.setAttribute("aria-hidden", "true");
    const info = crear("div", "deuda-info");
    let detalle = TIPOS_DEUDA[d.tipo].nombre;
    if (d.tasa) detalle += " · " + String(d.tasa).replace(".", ",") + "% mensual";
    const detalleEl = crear("span", "", detalle);
    if (foco && d.id === foco.id) detalleEl.prepend(crear("span", "etiqueta-foco", "Foco"));
    info.append(crear("strong", "", d.nombre), detalleEl);
    const saldoEl = crear("div", "deuda-saldo");
    saldoEl.append(
      crear("strong", "", saldo > 0 ? formatearDinero(saldo) : "Pagada ✓"),
      crear("span", "", d.cuota ? "Cuota " + formatearDinero(d.cuota) : "Sin cuota")
    );
    arriba.append(icono, info, saldoEl);

    const barra = crear("div", "deuda-barra");
    const relleno = crear("span");
    relleno.style.width = Math.round(avanceDeuda * 100) + "%";
    barra.appendChild(relleno);

    const abajo = crear("div", "deuda-abajo");
    let fecha = "";
    if (saldo <= 0) fecha = "¡Terminada!";
    else if (d.tipo === "hipotecario") fecha = "Fuera del plan (hipotecario)";
    else if (sim && sim.fin && sim.fin[d.id]) fecha = "Terminas en " + nombreMesLargo(moverMes(mesActual(), sim.fin[d.id]));
    abajo.appendChild(crear("span", "fecha", fecha));
    if (saldo > 0) {
      const pagar = crear("button", "pagar", "Pagar");
      pagar.type = "button";
      pagar.addEventListener("click", function () {
        abrirRegistro({ tipo: "deuda", categoria: d.id, monto: d.cuota || 0, descripcion: "", titulo: "Pagar deuda" });
      });
      abajo.appendChild(pagar);
    }
    const editar = crear("button", "", "Editar");
    editar.type = "button";
    editar.addEventListener("click", function () { abrirDeuda(d); });
    abajo.appendChild(editar);

    li.append(arriba, barra, abajo);
    pantalla.listaDeudas.appendChild(li);
  });
}

document.querySelectorAll('input[name="metodo"]').forEach(function (opcion) {
  opcion.addEventListener("change", function () {
    ajustes.metodoDeudas = opcion.value;
    guardarAjustes();
    actualizarPantalla();
  });
});

pantalla.usarPlanDeudas.addEventListener("click", function () {
  ajustes.presupuestoDeudas = Math.round(deudasSegunPlan());
  guardarAjustes();
  actualizarDeudas();
});

pantalla.presupuestoDeudas.addEventListener("input", function () {
  formatearMientrasEscribe(pantalla.presupuestoDeudas);
  ajustes.presupuestoDeudas = leerMonto(pantalla.presupuestoDeudas.value) || 0;
  guardarAjustes();
  actualizarDeudas();
});

// ----- Ventana para agregar o editar una deuda -----

let deudaEditando = null;

function llenarTiposDeuda(elegido) {
  pantalla.deudaTipo.innerHTML = "";
  Object.keys(TIPOS_DEUDA).forEach(function (clave) {
    const opcion = crear("label", "opcion-categoria");
    const radio = crear("input");
    radio.type = "radio";
    radio.name = "tipo-deuda";
    radio.value = clave;
    radio.checked = clave === elegido;
    opcion.append(radio, crear("span", "", TIPOS_DEUDA[clave].icono + " " + TIPOS_DEUDA[clave].nombre));
    pantalla.deudaTipo.appendChild(opcion);
  });
}

function abrirDeuda(deuda) {
  deudaEditando = deuda || null;
  pantalla.errorDeuda.textContent = "";
  pantalla.tituloDeuda.textContent = deuda ? "Editar deuda" : "Nueva deuda";
  pantalla.deudaNombre.value = deuda ? deuda.nombre : "";
  llenarTiposDeuda(deuda ? deuda.tipo : "tarjeta");
  pantalla.deudaSaldo.value = deuda ? montoATexto(saldoDe(deuda)) : "";
  pantalla.deudaCuota.value = deuda && deuda.cuota ? montoATexto(deuda.cuota) : "";
  pantalla.deudaTasa.value = deuda && deuda.tasa ? String(deuda.tasa).replace(".", ",") : "";
  pantalla.eliminarDeuda.hidden = !deuda;
  pantalla.ventanaDeuda.showModal();
}

pantalla.agregarDeuda.addEventListener("click", function () { abrirDeuda(null); });
pantalla.cerrarDeuda.addEventListener("click", function () { pantalla.ventanaDeuda.close(); });

[pantalla.deudaSaldo, pantalla.deudaCuota].forEach(function (campo) {
  campo.addEventListener("input", function () { formatearMientrasEscribe(campo); });
});
pantalla.deudaTasa.addEventListener("input", function () {
  pantalla.deudaTasa.value = pantalla.deudaTasa.value.replace(".", ",").replace(/[^\d,]/g, "").replace(/,(?=.*,)/g, "");
});

pantalla.formularioDeuda.addEventListener("submit", function (evento) {
  evento.preventDefault();
  const nombre = pantalla.deudaNombre.value.trim();
  const saldo = leerMonto(pantalla.deudaSaldo.value);
  const cuota = leerMonto(pantalla.deudaCuota.value) || 0;
  const tasa = Number(pantalla.deudaTasa.value.replace(",", ".")) || 0;
  const tipo = (pantalla.formularioDeuda.querySelector('input[name="tipo-deuda"]:checked') || {}).value || "otro";

  if (!nombre) { pantalla.errorDeuda.textContent = "Escribe con quién es la deuda."; return pantalla.deudaNombre.focus(); }
  if (!(saldo >= 0) || pantalla.deudaSaldo.value === "") { pantalla.errorDeuda.textContent = "Escribe cuánto debes hoy."; return pantalla.deudaSaldo.focus(); }
  if (tasa > 20) { pantalla.errorDeuda.textContent = "El interés mensual parece muy alto. Revisa que sea mensual (ej: 2,5)."; return pantalla.deudaTasa.focus(); }

  if (deudaEditando) {
    deudaEditando.nombre = nombre;
    deudaEditando.tipo = tipo;
    deudaEditando.cuota = cuota;
    deudaEditando.tasa = tasa;
    deudaEditando.base = saldo + pagadoA(deudaEditando); // el saldo que escribes pasa a ser el saldo actual
  } else {
    deudas.push({ id: crearId(), nombre: nombre, tipo: tipo, base: saldo, cuota: cuota, tasa: tasa, creado: Date.now() });
  }
  guardarDeudas();
  pantalla.ventanaDeuda.close();
  actualizarPantalla();
  mostrarAviso(deudaEditando ? "Deuda actualizada ✓" : "Deuda agregada ✓");
});

pantalla.eliminarDeuda.addEventListener("click", function () {
  if (!deudaEditando) return;
  if (!window.confirm("¿Eliminar " + deudaEditando.nombre + "? Los pagos que ya anotaste se mantienen en tus movimientos.")) return;
  const id = deudaEditando.id;
  deudas = deudas.filter(function (d) { return d.id !== id; });
  guardarDeudas();
  pantalla.ventanaDeuda.close();
  actualizarPantalla();
  mostrarAviso("Deuda eliminada");
});
/* ---------- 13. Pestaña Ajustes ---------- */

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


// ----- Descargar en Excel (.xlsx) -----
// Un archivo .xlsx es un .zip con varios archivos de texto (XML) adentro.
// Aquí lo armamos a mano para que funcione sin internet ni programas extra.

function escaparXml(texto) {
  return String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function columnaExcel(n) {
  let letras = "";
  n++;
  while (n > 0) { const r = (n - 1) % 26; letras = String.fromCharCode(65 + r) + letras; n = Math.floor((n - 1) / 26); }
  return letras;
}

// Fecha "AAAA-MM-DD" → número de día de Excel.
function fechaExcel(texto) {
  const f = textoAFecha(texto);
  return Math.round((Date.UTC(f.getFullYear(), f.getMonth(), f.getDate()) - Date.UTC(1899, 11, 30)) / 86400000);
}

// filas: arreglo de arreglos. Cada celda puede ser texto, número o { fecha: "AAAA-MM-DD" } / { dinero: n } / { pct: n }.
function hojaXml(filas, anchos) {
  let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
  xml += '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
  if (anchos) xml += "<cols>" + anchos.map(function (a, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + a + '" customWidth="1"/>'; }).join("") + "</cols>";
  xml += "<sheetData>";
  filas.forEach(function (fila, i) {
    xml += '<row r="' + (i + 1) + '">';
    fila.forEach(function (celda, k) {
      const ref = columnaExcel(k) + (i + 1);
      if (celda === null || celda === undefined || celda === "") return;
      if (i === 0) xml += '<c r="' + ref + '" t="inlineStr" s="1"><is><t>' + escaparXml(celda) + "</t></is></c>";
      else if (typeof celda === "number") xml += '<c r="' + ref + '"><v>' + celda + "</v></c>";
      else if (celda.fecha) xml += '<c r="' + ref + '" s="2"><v>' + fechaExcel(celda.fecha) + "</v></c>";
      else if (celda.dinero !== undefined) xml += '<c r="' + ref + '" s="3"><v>' + Math.round(celda.dinero * 100) / 100 + "</v></c>";
      else if (celda.pct !== undefined) xml += '<c r="' + ref + '" s="4"><v>' + celda.pct / 100 + "</v></c>";
      else xml += '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + escaparXml(celda) + "</t></is></c>";
    });
    xml += "</row>";
  });
  return xml + "</sheetData></worksheet>";
}

// Arma el .zip (sin compresión) con los archivos del Excel.
function crearZip(archivos) {
  const codificador = new TextEncoder();
  const tabla = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = tabla[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function numeros(lista) {
    const salida = [];
    lista.forEach(function (par) {
      for (let i = 0; i < par[1]; i++) salida.push((par[0] >>> (8 * i)) & 0xff);
    });
    return new Uint8Array(salida);
  }

  const partes = [];
  const central = [];
  let posicion = 0;
  archivos.forEach(function (archivo) {
    const nombre = codificador.encode(archivo.nombre);
    const datos = codificador.encode(archivo.contenido);
    const crc = crc32(datos);
    const local = numeros([[0x04034b50, 4], [20, 2], [0, 2], [0, 2], [0, 2], [0, 2], [crc, 4], [datos.length, 4], [datos.length, 4], [nombre.length, 2], [0, 2]]);
    partes.push(local, nombre, datos);
    central.push(numeros([[0x02014b50, 4], [20, 2], [20, 2], [0, 2], [0, 2], [0, 2], [0, 2], [crc, 4], [datos.length, 4], [datos.length, 4],
      [nombre.length, 2], [0, 2], [0, 2], [0, 2], [0, 2], [0, 4], [posicion, 4]]), nombre);
    posicion += local.length + nombre.length + datos.length;
  });
  const tamanoCentral = central.reduce(function (s, p) { return s + p.length; }, 0);
  const fin = numeros([[0x06054b50, 4], [0, 2], [0, 2], [archivos.length, 2], [archivos.length, 2], [tamanoCentral, 4], [posicion, 4], [0, 2]]);
  return new Blob(partes.concat(central, [fin]), { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function crearExcel(hojas) {
  const formatoDinero = decimalesMoneda() > 0 ? "#,##0.00" : "#,##0";
  const archivos = [
    { nombre: "[Content_Types].xml", contenido: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      hojas.map(function (h, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join("") + "</Types>" },
    { nombre: "_rels/.rels", contenido: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { nombre: "xl/workbook.xml", contenido: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      hojas.map(function (h, i) { return '<sheet name="' + escaparXml(h.nombre) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join("") + "</sheets></workbook>" },
    { nombre: "xl/_rels/workbook.xml.rels", contenido: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      hojas.map(function (h, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join("") +
      '<Relationship Id="rId' + (hojas.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { nombre: "xl/styles.xml", contenido: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<numFmts count="3"><numFmt numFmtId="164" formatCode="dd-mm-yyyy"/><numFmt numFmtId="165" formatCode="' + formatoDinero + '"/><numFmt numFmtId="166" formatCode="0%"/></numFmts>' +
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF173F35"/></patternFill></fill></fills>' +
            '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="5">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
      '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>' }
  ];
  hojas.forEach(function (h, i) {
    archivos.push({ nombre: "xl/worksheets/sheet" + (i + 1) + ".xml", contenido: hojaXml(h.filas, h.anchos) });
  });
  return crearZip(archivos);
}

function nombreTipo(m) {
  return { gasto: "Gasto", ingreso: "Ingreso", ahorro: "Ahorro", deuda: "Pago de deuda" }[m.tipo];
}

function descargarExcel() {
  const d = function (n) { return { dinero: n }; };

  // 1) Movimientos
  const ordenados = movimientos.slice().sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.creado - b.creado; });
  const filasMov = [["Fecha", "Tipo", "Categoría", "Grupo", "Descripción", "Monto", "Efecto en tu disponible"]];
  ordenados.forEach(function (m) {
    const grupo = m.tipo === "gasto" ? (grupoDe(m.categoria) === "gustos" ? "Gustos" : "Necesidades")
      : m.tipo === "deuda" ? "Deudas" : m.tipo === "ahorro" ? "Ahorro" : "Ingresos";
    const categoria = m.tipo === "ahorro" ? (buscarMeta(m.metaId) ? buscarMeta(m.metaId).nombre : "Ahorro general")
      : m.tipo === "deuda" ? (buscarDeuda(m.deudaId) ? buscarDeuda(m.deudaId).nombre : m.categoria) : m.categoria;
    filasMov.push([{ fecha: m.fecha }, nombreTipo(m), categoria, grupo, m.descripcion, d(m.monto), d(m.tipo === "ingreso" ? m.monto : -m.monto)]);
  });

  // 2) Resumen mes a mes (desde el primer movimiento hasta hoy)
  const filasRes = [["Mes", "Entró", "Necesidades", "Gustos", "Pagos de deudas", "Ahorro", "Te quedó libre", "Disponible acumulado", "Deuda restante", "Ahorro acumulado"]];
  if (ordenados.length) {
    let mes = mesDe(ordenados[0].fecha);
    while (mes <= mesActual()) {
      const t = totalesDe(mes);
      filasRes.push([nombreMesConAnio(mes), d(t.ingresos), d(t.necesidades), d(t.gustos), d(t.deudas), d(t.ahorro), d(t.libre),
        d(disponibleHasta(mes)), d(deudaRestanteAl(mes)), d(ahorroAcumuladoAl(mes))]);
      mes = moverMes(mes, 1);
    }
  }

  // 3) Deudas
  const sim = simularDeudas(presupuestoDeudas());
  const filasDeu = [["Deuda", "Tipo", "Pagado en la app", "Saldo actual", "Cuota mensual", "Interés mensual", "Orden de pago", "Término estimado"]];
  deudasOrdenadas().forEach(function (deuda, i) {
    const fin = sim && sim.fin && sim.fin[deuda.id] ? nombreMesLargo(moverMes(mesActual(), sim.fin[deuda.id])) : (saldoDe(deuda) <= 0 ? "Pagada" : "");
    filasDeu.push([deuda.nombre, TIPOS_DEUDA[deuda.tipo].nombre, d(pagadoA(deuda)), d(saldoDe(deuda)), d(deuda.cuota),
      { pct: deuda.tasa }, i + 1, fin]);
  });
  if (deudas.length) filasDeu.push(["Total", "", d(deudas.reduce(function (s, x) { return s + pagadoA(x); }, 0)), d(totalDeudas()), d(totalCuotas())]);

  // 4) Metas de ahorro
  const filasMet = [["Meta", "Objetivo", "Ahorrado", "Falta", "Aporte mensual", "Fecha estimada"]];
  metas.forEach(function (meta) {
    const ahorrado = aportadoA(meta.id);
    const falta = Math.max(meta.objetivo - ahorrado, 0);
    const meses = mesesParaMeta(falta, meta.aporte);
    filasMet.push([meta.nombre, d(meta.objetivo), d(ahorrado), d(falta), d(meta.aporte),
      falta <= 0 && meta.objetivo > 0 ? "Cumplida" : (meses ? nombreMesLargo(moverMes(mesActual(), meses)) : "")]);
  });
  if (aportadoA("") > 0) filasMet.push(["Ahorro general", "", d(aportadoA(""))]);

  // 5) Tu plan
  const reparto = repartoPlan();
  const base = ingresoBase().monto;
  const t = totalesDe(mesActual());
  const filasPlan = [["Grupo", "Porcentaje del plan", "Presupuesto este mes", "Usado este mes", "Diferencia"]];
  GRUPOS.forEach(function (g) {
    const limite = base * (reparto[g.clave] || 0) / 100;
    filasPlan.push([g.nombre, { pct: reparto[g.clave] || 0 }, d(limite), d(t[g.clave]), d(limite - t[g.clave])]);
  });
  filasPlan.push([]);
  filasPlan.push(["Plan elegido", PLANES[ajustes.plan].nombre]);
  filasPlan.push(["Ingreso de referencia", d(base)]);
  filasPlan.push(["Moneda", MONEDAS[ajustes.moneda] + " (" + ajustes.moneda + ")"]);
  filasPlan.push(["Descargado el", { fecha: hoyTexto() }]);

  const archivo = crearExcel([
    { nombre: "Movimientos", filas: filasMov, anchos: [12, 15, 24, 14, 32, 14, 22] },
    { nombre: "Resumen mensual", filas: filasRes, anchos: [16, 14, 14, 14, 16, 14, 16, 20, 16, 18] },
    { nombre: "Deudas", filas: filasDeu, anchos: [30, 20, 18, 16, 16, 16, 14, 22] },
    { nombre: "Metas de ahorro", filas: filasMet, anchos: [26, 14, 14, 14, 16, 22] },
    { nombre: "Tu plan", filas: filasPlan, anchos: [24, 20, 22, 18, 16] }
  ]);
  const enlace = crear("a");
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = "mi-bolsillo-" + hoyTexto() + ".xlsx";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(function () { URL.revokeObjectURL(enlace.href); }, 1000);
  mostrarAviso("Excel descargado ✓");
}

pantalla.descargarExcel.addEventListener("click", descargarExcel);

// Descarga un archivo con todos tus datos.
pantalla.descargarRespaldo.addEventListener("click", function () {
  const datos = {
    app: "Mi Bolsillo", version: 6, fecha: hoyTexto(),
    ajustes: {
      moneda: ajustes.moneda, presupuestoDeudas: ajustes.presupuestoDeudas, metodoDeudas: ajustes.metodoDeudas,
      plan: ajustes.plan, planPersonal: ajustes.planPersonal
    },
    movimientos: movimientos,
    deudas: deudas,
    metas: metas
  };
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
    if (datos.app !== "Mi Bolsillo") throw new Error("no es un respaldo");

    // Archivo solo de deudas: se agregan a las que ya tienes.
    if (datos.tipo === "deudas") {
      const nuevas = limpiarDeudas(datos.deudas).filter(function (d) {
        return !deudas.some(function (actual) { return actual.nombre === d.nombre; });
      });
      if (nuevas.length === 0) return mostrarAviso("Esas deudas ya estaban cargadas.");
      if (!window.confirm("Se agregarán " + nuevas.length + " deudas. ¿Continuar?")) return;
      deudas = deudas.concat(nuevas);
      guardarDeudas();
      actualizarPantalla();
      irA("deudas");
      return mostrarAviso(nuevas.length + " deudas cargadas ✓");
    }

    // Respaldo completo: reemplaza todo.
    const recuperados = limpiarMovimientos(datos.movimientos);
    const confirmar = window.confirm(
      "Este respaldo tiene " + recuperados.length + " movimientos. " +
      "Reemplazará los " + movimientos.length + " que tienes ahora en este dispositivo. ¿Continuar?"
    );
    if (!confirmar) return;

    movimientos = recuperados;
    if (Array.isArray(datos.deudas)) deudas = limpiarDeudas(datos.deudas);
    if (Array.isArray(datos.metas)) metas = limpiarMetas(datos.metas, metaFondo());
    if (datos.ajustes) {
      if (MONEDAS[datos.ajustes.moneda]) ajustes.moneda = datos.ajustes.moneda;
      if (PLANES[datos.ajustes.plan]) ajustes.plan = datos.ajustes.plan;
      if (datos.ajustes.planPersonal) ajustes.planPersonal = datos.ajustes.planPersonal;
      if (Number(datos.ajustes.presupuestoDeudas) > 0) ajustes.presupuestoDeudas = Number(datos.ajustes.presupuestoDeudas);
      if (datos.ajustes.metodoDeudas) ajustes.metodoDeudas = datos.ajustes.metodoDeudas === "avalancha" ? "avalancha" : "bola";
    }
    guardarMovimientos();
    guardarDeudas();
    guardarMetas();
    guardarAjustes();
    pantalla.simulador.value = "";
    actualizarPantalla();
    mostrarAviso("Datos recuperados ✓");
  }).catch(function () {
    mostrarAviso("Ese archivo no es de Mi Bolsillo.");
  });
});

pantalla.borrarTodo.addEventListener("click", function () {
  const confirmar = window.confirm("¿Seguro? Se borrarán los " + movimientos.length + " movimientos, las " + deudas.length + " deudas y tus metas de este dispositivo.");
  if (!confirmar) return;
  movimientos = [];
  deudas = [];
  metas = limpiarMetas([], metaFondo());
  guardarMovimientos();
  guardarDeudas();
  guardarMetas();
  pantalla.simulador.value = "";
  actualizarPantalla();
  mostrarAviso("Se borraron tus datos");
});


/* ---------- 14. Pestañas ---------- */

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
  if (vista === "deudas") actualizarDeudas();
  if (vista === "ahorro") actualizarAhorro();
  window.scrollTo(0, 0);
}

pantalla.pestanas.forEach(function (pestana) {
  pestana.addEventListener("click", function () { irA(pestana.dataset.vista); });
});
pantalla.codigoMoneda.addEventListener("click", function () { irA("ajustes"); });
pantalla.abrirAjustes.addEventListener("click", function () { irA("ajustes"); });
pantalla.filaDeudas.addEventListener("click", function () { irA("deudas"); });
pantalla.cambiarPlan.addEventListener("click", function () { irA("plan"); });


/* ---------- 15. Aviso inferior ---------- */

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


/* ---------- 16. Registrar un movimiento ---------- */

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
  pantalla.descripcionOpcional.hidden = tipo !== "deuda" && tipo !== "ahorro";
  pantalla.sinDeudas.hidden = true;

  // Para un pago de deuda, las "categorías" son tus deudas pendientes.
  if (tipo === "deuda") {
    pantalla.ayudaTipo.textContent = AYUDA_TIPO.deuda;
    pantalla.categoria.innerHTML = "";
    const pendientes = deudasOrdenadas().filter(function (d) { return saldoDe(d) > 0; });
    pantalla.sinDeudas.hidden = pendientes.length > 0;
    const foco = deudaFoco();
    const elegir = pendientes.some(function (d) { return d.id === preferida; }) ? preferida : (foco ? foco.id : (pendientes[0] || {}).id);
    pendientes.forEach(function (d) {
      const opcion = crear("label", "opcion-categoria");
      const radio = crear("input");
      radio.type = "radio";
      radio.name = "categoria";
      radio.value = d.id;
      radio.checked = d.id === elegir;
      opcion.append(radio, crear("span", "", TIPOS_DEUDA[d.tipo].icono + " " + d.nombre));
      pantalla.categoria.appendChild(opcion);
    });
    return;
  }

  // Para un ahorro, las "categorías" son tus metas.
  if (tipo === "ahorro") {
    pantalla.ayudaTipo.textContent = AYUDA_TIPO.ahorro;
    pantalla.categoria.innerHTML = "";
    const opciones = metas.map(function (m) { return { id: m.id, texto: m.icono + " " + m.nombre }; })
      .concat([{ id: "general", texto: "🐷 Ahorro general" }]);
    const porDefecto = pasoActual() !== 2 && fondoEmergencia() < metaFondo() ? "emergencias" : opciones[0].id;
    const elegir = opciones.some(function (o) { return o.id === preferida; }) ? preferida : porDefecto;
    opciones.forEach(function (o) {
      const opcion = crear("label", "opcion-categoria");
      const radio = crear("input");
      radio.type = "radio";
      radio.name = "categoria";
      radio.value = o.id;
      radio.checked = o.id === elegir;
      opcion.append(radio, crear("span", "", o.texto));
      pantalla.categoria.appendChild(opcion);
    });
    return;
  }

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
  buscar("tipo-" + (opciones.tipo || "gasto")).checked = true;
  llenarCategorias(opciones.categoria);
  pantalla.descripcion.value = opciones.descripcion || "";
  pantalla.monto.value = opciones.monto ? montoATexto(opciones.monto) : "";
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

// Tocar fuera de una ventana también la cierra.
[pantalla.ventanaRegistro, pantalla.ventanaDeuda].forEach(function (ventana) {
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

  const tipo = tipoElegido();
  const deuda = tipo === "deuda" ? buscarDeuda(categoriaElegida()) : null;
  const meta = tipo === "ahorro" ? buscarMeta(categoriaElegida()) : null;

  if (!(monto > 0)) return mostrarError("Escribe un monto mayor a cero.", pantalla.monto);
  if (tipo === "deuda" && !deuda) return mostrarError("Elige a qué deuda corresponde el pago.");
  if (!descripcion && tipo !== "deuda" && tipo !== "ahorro") return mostrarError("Escribe una descripción.", pantalla.descripcion);
  if (!fecha) return mostrarError("Elige una fecha.", pantalla.fecha);
  mostrarError("");

  const nuevo = {
    id: crearId(),
    tipo: tipo,
    monto: monto,
    descripcion: descripcion || (deuda ? "Pago " + deuda.nombre : "Ahorro " + (meta ? meta.nombre : "general")),
    categoria: deuda ? deuda.nombre : tipo === "ahorro" ? (meta ? meta.nombre : "Ahorro general") : categoriaElegida(),
    fecha: fecha,
    creado: Date.now()
  };
  if (deuda) nuevo.deudaId = deuda.id;
  if (tipo === "ahorro") nuevo.metaId = meta ? meta.id : "";
  const saldoAntes = deuda ? saldoDe(deuda) : 0;
  const faltabaMeta = meta ? meta.objetivo - aportadoA(meta.id) : 0;
  movimientos.push(nuevo);

  if (!guardarMovimientos()) {
    movimientos.pop();
    return;
  }

  pantalla.monto.value = "";
  pantalla.descripcion.value = "";
  pantalla.ventanaRegistro.close();
  actualizarPantalla();
  if (deuda && saldoAntes > 0 && saldoDe(deuda) <= 0) {
    mostrarAviso("🎉 ¡Terminaste de pagar " + deuda.nombre + "!");
  } else if (deuda) {
    mostrarAviso("Pago anotado. A " + deuda.nombre + " le quedan " + formatearDinero(saldoDe(deuda)));
  } else if (meta && faltabaMeta > 0 && aportadoA(meta.id) >= meta.objetivo) {
    mostrarAviso("🎉 ¡Cumpliste tu meta " + meta.nombre + "!");
  } else {
    mostrarAviso(tipo === "ahorro" ? "¡Bien! Apartaste " + formatearDinero(monto) + " 🐷" : "Guardado ✓");
  }
});


/* ---------- 17. Eliminar movimientos ---------- */

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


/* ---------- 18. Actualizar todo y abrir la app ---------- */

function actualizarPantalla() {
  actualizarSaludo();
  actualizarMoneda();
  pantalla.moneda.value = ajustes.moneda;
  actualizarResumen();
  dibujarLista(mesActual(), pantalla.lista, pantalla.contador, pantalla.vacio);
  if (!pantalla.vistas.progreso.hidden) actualizarProgreso();
  if (!pantalla.vistas.plan.hidden) actualizarPlan();
  if (!pantalla.vistas.deudas.hidden) actualizarDeudas();
  if (!pantalla.vistas.ahorro.hidden) actualizarAhorro();
}

pantalla.fecha.value = hoyTexto();
llenarCategorias();
actualizarPantalla();