"use client";

import { useCallback, useEffect, useState } from "react";
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  getStatus,
  listarProductos,
  obtenerProducto,
  type Producto,
  type Status,
} from "@/lib/api";

type Form = { nombre: string; precio: string; stock: string };

const FORM_VACIO: Form = { nombre: "", precio: "", stock: "" };

const formatoPrecio = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" });

// Ranita dibujada a mano: cabeza verde, ojos saltones y mejillas rojas
function Ranita({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 52" className={className} aria-hidden="true">
      <circle cx="18" cy="16" r="12" fill="#5cb85c" />
      <circle cx="46" cy="16" r="12" fill="#5cb85c" />
      <ellipse cx="32" cy="32" rx="28" ry="19" fill="#5cb85c" />
      <circle cx="18" cy="16" r="8" fill="#fff" />
      <circle cx="46" cy="16" r="8" fill="#fff" />
      <circle cx="19" cy="17" r="3.5" fill="#2f4a22" />
      <circle cx="45" cy="17" r="3.5" fill="#2f4a22" />
      <ellipse cx="14" cy="36" rx="4.5" ry="2.5" fill="#e8505b" opacity="0.85" />
      <ellipse cx="50" cy="36" rx="4.5" ry="2.5" fill="#e8505b" opacity="0.85" />
      <path d="M24 37 Q32 44 40 37" stroke="#2f4a22" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function ProductosPanel() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(FORM_VACIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [filtro, setFiltro] = useState("");
  const [buscarId, setBuscarId] = useState("");
  const [encontrado, setEncontrado] = useState<Producto | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setProductos(await listarProductos());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  // Carga inicial: el estado solo se actualiza cuando responde el backend
  useEffect(() => {
    listarProductos()
      .then(setProductos)
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
    getStatus()
      .then(setStatus)
      .catch(() => setStatusError(true));
  }, []);

  const avisar = (texto: string) => {
    setMensaje(texto);
    setTimeout(() => setMensaje(null), 3000);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const datos = {
      nombre: form.nombre.trim(),
      precio: form.precio === "" ? 0 : Number(form.precio),
      stock: form.stock === "" ? 0 : Number(form.stock),
    };
    setGuardando(true);
    try {
      if (editandoId) {
        await actualizarProducto(editandoId, datos);
        avisar("Producto actualizado");
      } else {
        await crearProducto(datos);
        avisar("Producto creado");
      }
      setForm(FORM_VACIO);
      setEditandoId(null);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const editar = (p: Producto) => {
    setEditandoId(p.id);
    setForm({ nombre: p.nombre, precio: String(p.precio), stock: String(p.stock) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelar = () => {
    setEditandoId(null);
    setForm(FORM_VACIO);
  };

  const borrar = async (p: Producto) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    setError(null);
    try {
      await eliminarProducto(p.id);
      if (editandoId === p.id) cancelar();
      if (encontrado?.id === p.id) setEncontrado(null);
      avisar("Producto eliminado");
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const buscarPorId = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEncontrado(null);
    try {
      setEncontrado(await obtenerProducto(Number(buscarId)));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const visibles = productos.filter((p) =>
    p.nombre.toLowerCase().includes(filtro.trim().toLowerCase())
  );

  const card = "rounded-3xl bg-white p-5 shadow-[0_4px_0_#cfe8c0]";
  const input =
    "w-full min-w-0 rounded-full border-2 border-rana-claro bg-white px-4 py-2 text-sm outline-none transition placeholder:text-rana/60 focus:border-rana";
  const botonVerde =
    "rounded-full bg-rana px-5 py-2 text-sm font-medium text-white transition hover:bg-rana-oscuro disabled:opacity-50";
  const botonSuave =
    "rounded-full bg-rana-claro px-4 py-2 text-sm font-medium text-rana-oscuro transition hover:bg-[#cdeabd]";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-10">
      <header className="flex flex-col items-center gap-2 text-center">
        <Ranita className="h-16 w-20" />
        <h1 className="text-3xl font-semibold text-rana-oscuro">Productos</h1>
        <span className="inline-flex items-center gap-2 text-xs text-foreground/70" title={status?.timestamp}>
          <span
            className={`h-2 w-2 rounded-full ${
              status ? "bg-rana" : statusError ? "bg-mejilla" : "animate-pulse bg-rana-claro"
            }`}
          />
          {status ? "Backend conectado" : statusError ? "Backend sin respuesta" : "Despertando al backend…"}
        </span>
      </header>

      {error && (
        <p className="rounded-full bg-[#fde6e7] px-4 py-2 text-center text-sm text-mejilla">{error}</p>
      )}
      {mensaje && (
        <p className="rounded-full bg-rana-claro px-4 py-2 text-center text-sm text-rana-oscuro">{mensaje}</p>
      )}

      <form onSubmit={enviar} className={`${card} flex flex-col gap-3`}>
        <h2 className="font-medium">{editandoId ? `Editar #${editandoId}` : "Nuevo producto"}</h2>
        <input
          className={input}
          placeholder="Nombre"
          aria-label="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          maxLength={100}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className={input}
            type="number"
            min="0"
            step="0.01"
            placeholder="Precio"
            aria-label="Precio"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
          />
          <input
            className={input}
            type="number"
            min="0"
            step="1"
            placeholder="Stock"
            aria-label="Stock"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={guardando} className={botonVerde}>
            {guardando ? "Guardando…" : editandoId ? "Guardar" : "Agregar"}
          </button>
          {editandoId && (
            <button type="button" onClick={cancelar} className={botonSuave}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <section className={`${card} flex flex-col gap-4`}>
        <div className="flex gap-2">
          <input
            className={input}
            placeholder="Filtrar por nombre"
            aria-label="Filtrar por nombre"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
          <button onClick={cargar} className={botonSuave} title="Recargar">
            ↻
          </button>
        </div>

        {cargando ? (
          <p className="py-6 text-center text-sm text-foreground/60">
            Cargando… (Render gratis puede tardar ~1 min en despertar)
          </p>
        ) : visibles.length === 0 ? (
          <p className="py-6 text-center text-sm text-foreground/60">
            {productos.length === 0 ? "Aún no hay productos" : "Nada coincide con el filtro"}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visibles.map((p) => (
              <li
                key={p.id}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${
                  editandoId === p.id ? "bg-rana-claro" : "bg-background"
                }`}
              >
                <span className="w-8 text-center text-xs text-foreground/50">#{p.id}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.nombre}</p>
                  <p className="text-xs text-foreground/60">
                    {formatoPrecio.format(p.precio)} · {p.stock} en stock
                  </p>
                </div>
                <button
                  onClick={() => editar(p)}
                  className="rounded-full px-3 py-1 text-xs text-rana-oscuro hover:bg-rana-claro"
                >
                  Editar
                </button>
                <button
                  onClick={() => borrar(p)}
                  className="rounded-full px-3 py-1 text-xs text-mejilla hover:bg-[#fde6e7]"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={buscarPorId} className={`${card} flex flex-col gap-3`}>
        <div className="flex gap-2">
          <input
            className={input}
            type="number"
            min="1"
            step="1"
            placeholder="Buscar por id"
            aria-label="Buscar por id"
            value={buscarId}
            onChange={(e) => setBuscarId(e.target.value)}
            required
          />
          <button type="submit" className={botonVerde}>
            Buscar
          </button>
        </div>
        {encontrado && (
          <p className="rounded-2xl bg-background px-4 py-2 text-sm">
            <span className="text-foreground/50">#{encontrado.id}</span>{" "}
            <span className="font-medium">{encontrado.nombre}</span> · {formatoPrecio.format(encontrado.precio)} ·{" "}
            {encontrado.stock} en stock
          </p>
        )}
      </form>

      <footer className="text-center text-xs text-foreground/50">🐸 hecho con Next.js + Render</footer>
    </div>
  );
}
