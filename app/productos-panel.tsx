"use client";

import { useCallback, useEffect, useState } from "react";
import {
  API_URL,
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

  const input =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-indigo-900";
  const boton =
    "rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-sm text-zinc-500">
            Backend: <span className="font-mono">{API_URL}</span>
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-xs font-medium ${
            status
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              : statusError
                ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
          title={status?.timestamp}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              status ? "bg-emerald-500" : statusError ? "bg-red-500" : "animate-pulse bg-zinc-400"
            }`}
          />
          {status ? status.mensaje : statusError ? "Backend sin respuesta" : "Conectando con el backend…"}
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
      {mensaje && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          {mensaje}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <form
          onSubmit={enviar}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
        >
          <h2 className="font-semibold">{editandoId ? `Editar producto #${editandoId}` : "Nuevo producto"}</h2>
          <label className="flex flex-col gap-1 text-sm">
            Nombre
            <input
              className={input}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              maxLength={100}
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              Precio
              <input
                className={input}
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={(e) => setForm({ ...form, precio: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Stock
              <input
                className={input}
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className={`${boton} bg-indigo-600 text-white hover:bg-indigo-700`}
            >
              {guardando ? "Guardando…" : editandoId ? "Guardar cambios" : "Crear producto"}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={cancelar}
                className={`${boton} border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800`}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <form
          onSubmit={buscarPorId}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800"
        >
          <h2 className="font-semibold">Buscar por id</h2>
          <div className="flex gap-2">
            <input
              className={input}
              type="number"
              min="1"
              step="1"
              placeholder="Ej. 1"
              value={buscarId}
              onChange={(e) => setBuscarId(e.target.value)}
              required
            />
            <button type="submit" className={`${boton} bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900`}>
              Buscar
            </button>
          </div>
          {encontrado && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
              <dt className="text-zinc-500">Id</dt>
              <dd>{encontrado.id}</dd>
              <dt className="text-zinc-500">Nombre</dt>
              <dd>{encontrado.nombre}</dd>
              <dt className="text-zinc-500">Precio</dt>
              <dd>{formatoPrecio.format(encontrado.precio)}</dd>
              <dt className="text-zinc-500">Stock</dt>
              <dd>{encontrado.stock}</dd>
            </dl>
          )}
        </form>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold">
            Listado <span className="text-zinc-500">({visibles.length})</span>
          </h2>
          <div className="flex gap-2">
            <input
              className={`${input} sm:w-64`}
              placeholder="Filtrar por nombre"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            <button
              onClick={cargar}
              className={`${boton} border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800`}
            >
              Recargar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Id</th>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {cargando ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Cargando productos… (el backend gratuito de Render puede tardar ~1 min en despertar)
                  </td>
                </tr>
              ) : visibles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    {productos.length === 0 ? "No hay productos. Crea el primero." : "Ningún producto coincide con el filtro."}
                  </td>
                </tr>
              ) : (
                visibles.map((p) => (
                  <tr key={p.id} className={editandoId === p.id ? "bg-indigo-50 dark:bg-indigo-950/40" : ""}>
                    <td className="px-4 py-3 font-mono text-zinc-500">{p.id}</td>
                    <td className="px-4 py-3">{p.nombre}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatoPrecio.format(p.precio)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.stock}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => editar(p)}
                          className="rounded-md px-2 py-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => borrar(p)}
                          className="rounded-md px-2 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
