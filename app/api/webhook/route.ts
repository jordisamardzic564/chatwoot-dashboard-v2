import { NextResponse } from 'next/server';

// De base URL van n8n
const N8N_BASE = "https://n8n.srv865019.hstgr.cloud/webhook";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, ...data } = body;

    // Endpoint is de naam van de webhook (bv. 'odoo-update-lead')
    if (!endpoint) {
      return NextResponse.json({ error: "No endpoint specified" }, { status: 400 });
    }

    // Server-side fetch naar n8n (geen CORS issues hier)
    const res = await fetch(`${N8N_BASE}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // Als n8n JSON teruggeeft, stuur die door. Anders lege success.
    let responseData = {};
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseData = await res.json();
    }

    if (!res.ok) {
      return NextResponse.json({ error: "n8n error", details: responseData }, { status: res.status });
    }

    return NextResponse.json(responseData);

  } catch (e) {
    console.error("Proxy error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

