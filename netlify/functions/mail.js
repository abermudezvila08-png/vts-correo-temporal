
const BASE = "https://api.guerrillamail.com/ajax.php";

const ALLOWED = new Set([
  "get_email_address",
  "get_email_list",
  "check_email",
  "fetch_email",
  "extend"
]);

export default async (req) => {
  if (req.method !== "POST") {
    return Response.json(
      { error: "Se requiere una petición POST." },
      { status: 405 }
    );
  }

  let body;

  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "El contenido recibido no es JSON válido." },
      { status: 400 }
    );
  }

  const action = String(body.action || "");

  if (!ALLOWED.has(action)) {
    return Response.json(
      { error: "Operación no permitida." },
      { status: 400 }
    );
  }

  const params = body.params || {};
  const url = new URL(BASE);

  url.searchParams.set("f", action);
  url.searchParams.set("ip", "127.0.0.1");
  url.searchParams.set("agent", "VTS_Correo_Temporal");
  url.searchParams.set("lang", "en");

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    const raw = await response.text();
    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      return Response.json({
        error: "El proveedor no devolvió JSON válido.",
        httpStatus: response.status,
        preview: raw.slice(0, 250)
      }, { status: 502 });
    }

    return Response.json({
      data,
      upstreamStatus: response.status,
      aviso: "Conexión intentada; la sesión y la operación deben validarse."
    });

  } catch (error) {
    return Response.json({
      error: "No se pudo conectar con el proveedor.",
      detalle: String(error.message || error)
    }, { status: 502 });
  }
};

export const config = {
  path: "/.netlify/functions/mail"
};
