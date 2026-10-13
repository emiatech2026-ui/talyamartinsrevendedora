import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing json with generous limit for captured photos
app.use(express.json({ limit: "25mb" }));

// Initialize Google GenAI client
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Endpoint: Parse Boleto from Image
app.post("/api/gemini/parse-boleto", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", brands = [] } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Imagem não fornecida." });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY não configurada no servidor.",
        needsApiKey: true,
      });
    }

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "");

    const knownBrandsList = brands.length > 0
      ? brands.join(", ")
      : "O Boticário, Eudora";

    const prompt = `Analise a foto ou documento deste boleto bancário / fatura de revendedora de cosméticos.
As marcas parceiras comuns da revendedora são: ${knownBrandsList}.

Extraia com máxima precisão os seguintes campos:
1. brand: O nome da marca emissora (ex: "O Boticário", "Eudora", ou outra identificada).
2. amount: O valor final do documento a pagar em reais (número com casas decimais, ex: 289.50). Se houver descontos ou acréscimos, considere o valor final a pagar.
3. dueDate: A data de vencimento no formato estrito "AAAA-MM-DD" (ex: "2026-09-25").
4. barcode: A linha digitável completa (geralmente 47 ou 48 números com espaços ou pontos) ou o código de barras numérico.
5. cycle: Identificação do ciclo de vendas ou número da nota/pedido (ex: "Ciclo 09/2026", "Pedido 94821", etc.). Se não houver ciclo explícito, coloque "Ciclo Regular".
6. notes: Alguma observação relevante encontrada no boleto (ex: "Boleto Banco Itaú", "Pagável em qualquer banco até o vencimento").

Retorne os dados estritamente no esquema JSON solicitado.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brand: { type: Type.STRING, description: "Nome da marca parceira" },
            amount: { type: Type.NUMBER, description: "Valor do boleto a pagar" },
            dueDate: { type: Type.STRING, description: "Data de vencimento formato AAAA-MM-DD" },
            barcode: { type: Type.STRING, description: "Linha digitável ou código de barras" },
            cycle: { type: Type.STRING, description: "Ciclo de vendas ou número da fatura" },
            notes: { type: Type.STRING, description: "Observações extras do boleto" },
          },
          required: ["brand", "amount", "dueDate"],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      data: parsedJson,
    });
  } catch (error: any) {
    console.error("Erro ao analisar boleto com Gemini:", error);
    return res.status(500).json({
      error: "Falha ao processar a imagem do boleto com inteligência artificial.",
      details: error?.message || String(error),
    });
  }
});

// Endpoint: Parse Products from Image (for stock entry)
app.post("/api/gemini/parse-products", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", configuredBrands = [] } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Imagem não fornecida." });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(500).json({
        error: "GEMINI_API_KEY não configurada no servidor.",
        needsApiKey: true,
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "");
    const brandsContext = configuredBrands.length > 0
      ? configuredBrands.join(", ")
      : "O Boticário, Eudora";

    const prompt = `Você é um assistente especialista em cosméticos e perfumaria no Brasil.
Analise a foto fornecida. Ela pode conter:
- Um ou mais frascos/embalagens de cosméticos (perfume, hidratante, shampoo, maquiagem, kit, etc.);
- Uma caixa com produtos recém-chegados;
- Ou uma nota fiscal / romaneio / espelho de pedido de revendedora com lista de produtos.

As marcas principais trabalhadas pela revendedora são: ${brandsContext}.

Identifique cada produto presente na imagem e extraia os dados para cadastro no estoque da revendedora:
- name: Nome comercial completo do cosmético (ex: "Malbec Desodorante Colônia 100ml", "Siàge Cauterização dos Fios Shampoo 250ml", "Batom Make B. Matte Red Velvet").
- brand: Marca do produto (ex: "O Boticário", "Eudora", etc.).
- category: Uma das seguintes categorias: "Perfumaria", "Maquiagem", "Corpo e Banho", "Cabelos", "Kits & Presentes", ou "Skincare".
- catalogPrice: Preço sugerido de venda no catálogo/site oficial em Reais (se reconhecido ou indicado na embalagem/nota, ex: 149.90).
- quantity: Quantidade de unidades visíveis na imagem ou indicadas na nota (geralmente 1 ou mais).
- code: Código de referência, EAN ou SKU se visível (se não encontrar, gere algo sugestivo ou deixe em branco).
- validity: Validade se visível na embalagem (ex: "10/2027" ou deixe em branco).
- batch: Lote se visível (ou deixe em branco).
- notes: Detalhes ou descrição breve (ex: "Amadeirado Marcante", "Para cabelos danificados").

Se houver mais de um produto na foto, liste todos os produtos distintos encontrados no array "products".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nome completo do produto cosmético" },
                  brand: { type: Type.STRING, description: "Marca (ex: O Boticário, Eudora)" },
                  category: {
                    type: Type.STRING,
                    description: "Categoria: Perfumaria, Maquiagem, Corpo e Banho, Cabelos, Kits & Presentes ou Skincare",
                  },
                  catalogPrice: { type: Type.NUMBER, description: "Preço de catálogo / venda sugerido em R$" },
                  quantity: { type: Type.INTEGER, description: "Quantidade de itens" },
                  code: { type: Type.STRING, description: "Código de referência ou código de barras se visível" },
                  validity: { type: Type.STRING, description: "Data ou mês/ano de validade se visível" },
                  batch: { type: Type.STRING, description: "Lote de fabricação se visível" },
                  notes: { type: Type.STRING, description: "Fragrância, família olfativa ou observação" },
                },
                required: ["name", "brand", "category", "catalogPrice", "quantity"],
              },
            },
          },
          required: ["products"],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || "{\"products\":[]}");
    return res.json({
      success: true,
      data: parsedJson,
    });
  } catch (error: any) {
    console.error("Erro ao analisar produtos com Gemini:", error);
    return res.status(500).json({
      error: "Falha ao processar a foto dos produtos com inteligência artificial.",
      details: error?.message || String(error),
    });
  }
});

// Vite Middleware for Dev and Static Files for Production
async function startServer() {
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
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

startServer();
