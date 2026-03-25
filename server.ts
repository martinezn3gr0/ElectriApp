import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY is not set. Email functionality will be disabled.");
      return null;
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for sending completion emails
  app.post("/api/send-completion-email", async (req, res) => {
    const { clientEmail, electricianEmail, projectName, projectUrl } = req.body;

    if (!clientEmail || !electricianEmail || !projectName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const resendClient = getResend();
    if (!resendClient) {
      return res.status(503).json({ error: "Email service not configured" });
    }

    try {
      const { data, error } = await resendClient.emails.send({
        from: "ElectriApp <notifications@resend.dev>",
        to: [clientEmail, electricianEmail],
        subject: `Proyecto Completado: ${projectName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #2563eb; text-align: center;">¡Proyecto Completado!</h1>
            <p>Hola,</p>
            <p>El proyecto <strong>"${projectName}"</strong> ha sido marcado como completado en ElectriApp.</p>
            <p>Por favor, confirma el estado final y deja una reseña si aún no lo has hecho.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${projectUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Ver Proyecto</a>
            </div>
            <p style="color: #666; font-size: 14px;">Gracias por usar ElectriApp.</p>
          </div>
        `,
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true, data });
    } catch (err) {
      console.error("Server error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
