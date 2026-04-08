
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

  app.post("/predict", (req, res) => {
    const { responses } = req.body; // responses: Array of 220 integers (0-3)

    if (!responses || !Array.isArray(responses) || responses.length !== 220) {
      return res.status(400).json({ error: "Invalid responses. Expected array of 220 integers." });
    }

    // 1. Process responses (handle reverse scoring and nulls)
    const reverseItems = [7, 30, 35, 58, 87, 90, 96, 97, 98, 131, 142, 155, 164, 177, 210, 215];
    const processedResponses: { [id: number]: number } = {};
    
    for (let i = 1; i <= 220; i++) {
      let val = responses[i - 1];
      if (val === null || val === undefined) {
        val = 0;
      }
      if (reverseItems.includes(i)) {
        processedResponses[i] = 3 - val;
      } else {
        processedResponses[i] = val;
      }
    }

    // 2. Compute 25 Facet Scores
    const facetScores: { [name: string]: number } = {};
    Object.entries(facets).forEach(([facetName, itemIds]) => {
      const scores = itemIds.map(id => processedResponses[id]);
      const sum = scores.reduce((a, b) => a + b, 0);
      facetScores[facetName] = sum / itemIds.length;
    });

    // 3. Compute 5 Domain Scores
    const domainScores: { [name: string]: number } = {};
    Object.entries(domains).forEach(([domainName, facetNames]) => {
      const scores = facetNames.map(name => facetScores[name]);
      const sum = scores.reduce((a, b) => a + b, 0);
      domainScores[domainName] = sum / facetNames.length;
    });

    // 4. Calculate ICD-10 Results
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

      // Normalize to 0-1 probability
      const probability = (rawScore - minPossible) / (maxPossible - minPossible);
      
      let risk_level = "LOW";
      let flagged = false;
      if (probability >= 0.60) {
        risk_level = "HIGH";
        flagged = true;
      } else if (probability >= 0.35) {
        risk_level = "FLAGGED";
        flagged = true;
      }

      return {
        code: model.code,
        name: model.name,
        probability: parseFloat(probability.toFixed(4)),
        risk_level,
        flagged
      };
    });

    // Sort by probability
    const sortedResults = [...icd10Results].sort((a, b) => b.probability - a.probability);
    const top = sortedResults[0];
    const flaggedCount = icd10Results.filter(r => r.flagged).length;

    let clinicalNote = "No personality disorder risk flags detected.";
    if (flaggedCount > 0) {
      clinicalNote = `${flaggedCount} risk flag(s) detected. Top association: ${top.name} (${(top.probability * 100).toFixed(1)}%). Clinical follow-up recommended.`;
    }

    res.json({
      facet_scores: facetScores,
      domain_scores: domainScores,
      icd10_results: icd10Results,
      top_diagnosis: `${top.code} — ${top.name}`,
      top_probability: top.probability,
      flagged_count: flaggedCount,
      clinical_note: clinicalNote
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
