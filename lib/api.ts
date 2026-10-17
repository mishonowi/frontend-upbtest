// Cliente del backend backendUpbtest (Express + PostgreSQL en Render)
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type Producto = {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  createdAt: string;
};

export type ProductoInput = {
  nombre: string;
  precio: number;
  stock: number;
};

export type Status = {
  status: string;
  mensaje: string;
  timestamp: string;
};

// Hace la petición y convierte el { error } del backend en una excepción legible
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("No se pudo conectar con el backend");
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error ?? `Error ${res.status}`);
  }
  return data as T;
}

export const getStatus = () => request<Status>("/api/status");

export const listarProductos = () => request<Producto[]>("/api/productos");

export const obtenerProducto = (id: number) => request<Producto>(`/api/productos/${id}`);

export const crearProducto = (datos: ProductoInput) =>
  request<Producto>("/api/productos", { method: "POST", body: JSON.stringify(datos) });

export const actualizarProducto = (id: number, datos: Partial<ProductoInput>) =>
  request<Producto>(`/api/productos/${id}`, { method: "PUT", body: JSON.stringify(datos) });

export const eliminarProducto = (id: number) =>
  request<void>(`/api/productos/${id}`, { method: "DELETE" });
