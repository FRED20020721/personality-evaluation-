
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { questions, facets, domains } from "./src/data/pid5.ts";
import { icd10Models } from "./src/data/icd10.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/questions", (req, res) => {
    res.json(questions);
  });

  app.post("/api/score", (req, res) => {
    const { answers } = req.body; // answers: { [questionId: number]: number } (0-3)

    if (!answers) {
      return res.status(400).json({ error: "Answers are required" });
    }

    const processedScores: { [id: number]: number } = {};
    questions.forEach((q) => {
      const userScore = answers[q.id];
      if (userScore !== undefined) {
        processedScores[q.id] = q.isReverse ? 3 - userScore : userScore;
      }
    });

    const facetScores: { [name: string]: number } = {};
    Object.entries(facets).forEach(([facetName, itemIds]) => {
      const scores = itemIds
        .map((id) => processedScores[id])
        .filter((s) => s !== undefined);
      
      if (scores.length > 0) {
        const sum = scores.reduce((a, b) => a + b, 0);
        facetScores[facetName] = sum / scores.length;
      } else {
        facetScores[facetName] = 0;
      }
    });

    const domainScores: { [name: string]: number } = {};
    Object.entries(domains).forEach(([domainName, facetNames]) => {
      const scores = facetNames
        .map((name) => facetScores[name])
        .filter((s) => s !== undefined);
      
      if (scores.length > 0) {
        const sum = scores.reduce((a, b) => a + b, 0);
        domainScores[domainName] = sum / scores.length;
      } else {
        domainScores[domainName] = 0;
      }
    });

    // Calculate ICD-10 Association Scores
    const icd10Results = icd10Models.map(model => {
      let rawScore = 0;
      let maxPossible = 0;
      let minPossible = 0;

      Object.entries(model.coefficients).forEach(([facetName, beta]) => {
        const facetScore = facetScores[facetName] || 0;
        rawScore += beta * facetScore;
        
        if (beta > 0) {
          maxPossible += beta * 3;
          minPossible += beta * 0;
        } else {
          maxPossible += beta * 0;
          minPossible += beta * 3;
        }
      });

      // Normalize to 0-100 index
      const associationIndex = ((rawScore - minPossible) / (maxPossible - minPossible)) * 100;

      return {
        code: model.code,
        name: model.name,
        score: associationIndex,
        description: model.description
      };
    });

    res.json({
      facetScores,
      domainScores,
      icd10Results
    });
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
