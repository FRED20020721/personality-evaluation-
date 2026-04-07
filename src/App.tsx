import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ClipboardList, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  BarChart3,
  Loader2,
  AlertCircle
} from "lucide-react";

interface Question {
  id: number;
  text: string;
}

interface Results {
  facetScores: { [name: string]: number };
  domainScores: { [name: string]: number };
  icd10Results: {
    code: string;
    name: string;
    score: number;
    description: string;
  }[];
}

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [id: number]: number }>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    fetch("/api/questions")
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch questions:", err);
        setError("Failed to load questionnaire. Please try again later.");
        setLoading(false);
      });
  }, []);

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert(`Please answer all questions. You have answered ${Object.keys(answers).length} out of ${questions.length}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      setResults(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Failed to submit answers:", err);
      alert("Failed to calculate scores. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.ceil(questions.length / itemsPerPage);
  const currentQuestions = questions.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const progress = (Object.keys(answers).length / questions.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading questionnaire...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (results) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200"
          >
            <div className="bg-indigo-600 p-8 text-white">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Assessment Results</h1>
              </div>
              <p className="text-indigo-100 opacity-90">
                The Personality Inventory for DSM-5 (PID-5)—Adult
              </p>
            </div>

            <div className="p-8">
              <section className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-rose-500 rounded-full"></span>
                  ICD-10 Personality Disorder Association
                </h2>
                <div className="space-y-4">
                  {results.icd10Results.sort((a, b) => b.score - a.score).map((res) => (
                    <div key={res.code} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md mb-1 inline-block">
                            {res.code}
                          </span>
                          <h3 className="text-lg font-bold text-slate-800">{res.name}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-slate-900">{Math.round(res.score)}%</span>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Association Index</p>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${res.score}%` }}
                          className={`h-full rounded-full ${
                            res.score > 70 ? "bg-rose-500" : res.score > 40 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                      </div>
                      <p className="text-sm text-slate-500 italic">{res.description}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-400 italic">
                  * These scores represent statistical associations based on literature mapping and are for research/educational purposes only. They do not constitute a clinical diagnosis.
                </p>
              </section>

              <section className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                  Domain Scores
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(results.domainScores).map(([name, score]) => (
                    <div key={name} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">{name}</h3>
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-indigo-600">{(score as number).toFixed(2)}</span>
                        <span className="text-slate-400 mb-1">/ 3.00</span>
                      </div>
                      <div className="mt-4 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${((score as number) / 3) * 100}%` }}
                          className="h-full bg-indigo-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                  Facet Scores
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(results.facetScores).map(([name, score]) => (
                    <div key={name} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 transition-colors">
                      <span className="text-slate-700 font-medium">{name}</span>
                      <span className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-lg">{(score as number).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
                >
                  Retake Assessment
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 mb-4">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">PID-5 Assessment</h1>
          <p className="text-slate-600 max-w-lg mx-auto mb-4">
            Please describe yourself as honestly as possible. There are no "right" or "wrong" answers.
          </p>
          <button 
            onClick={() => {
              setResults({
                facetScores: { "Anhedonia": 1.5, "Anxiousness": 2.1, "Attention Seeking": 0.8, "Callousness": 0.5, "Deceitfulness": 0.3 },
                domainScores: { "Negative Affect": 1.8, "Detachment": 1.2, "Antagonism": 0.6, "Disinhibition": 1.1, "Psychoticism": 0.9 },
                icd10Results: [
                  { code: "F60.3", name: "Borderline Personality Disorder", score: 85, description: "Instability in emotions, relationships, and self-image." },
                  { code: "F60.0", name: "Paranoid Personality Disorder", score: 62, description: "Pervasive distrust and suspicion." },
                  { code: "F60.6", name: "Avoidant Personality Disorder", score: 45, description: "Social inhibition and feelings of inadequacy." }
                ]
              });
            }}
            className="text-sm font-bold text-rose-600 bg-rose-50 px-4 py-2 rounded-full hover:bg-rose-100 transition-colors"
          >
            直接看結果頁面樣式 (Preview Results)
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-500">Overall Progress</span>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  const randomAnswers: { [id: number]: number } = {};
                  questions.forEach(q => {
                    randomAnswers[q.id] = Math.floor(Math.random() * 4);
                  });
                  setAnswers(randomAnswers);
                }}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Fill Randomly (Demo)
              </button>
              <span className="text-sm font-bold text-indigo-600">{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-600 rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 50 }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400 text-center">
            {Object.keys(answers).length} of {questions.length} questions answered
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {currentQuestions.map((q) => (
                <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors">
                  <div className="flex gap-4 mb-6">
                    <span className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold text-slate-500">
                      {q.id}
                    </span>
                    <p className="text-lg text-slate-800 font-medium leading-relaxed">
                      {q.text}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Very False", value: 0 },
                      { label: "Somewhat False", value: 1 },
                      { label: "Somewhat True", value: 2 },
                      { label: "Very True", value: 3 },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(q.id, option.value)}
                        className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${
                          answers[q.id] === option.value
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 scale-[1.02]"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="hidden sm:flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageIdx = i;
              if (currentPage > 2 && totalPages > 5) {
                pageIdx = Math.min(currentPage - 2 + i, totalPages - 1);
              }
              return (
                <button
                  key={pageIdx}
                  onClick={() => setCurrentPage(pageIdx)}
                  className={`w-10 h-10 rounded-lg font-bold transition-all ${
                    currentPage === pageIdx
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:bg-white"
                  }`}
                >
                  {pageIdx + 1}
                </button>
              );
            })}
          </div>

          {currentPage === totalPages - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(answers).length < questions.length}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-lg shadow-indigo-100 transition-all"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              Submit Assessment
            </button>
          ) : (
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <p className="mt-8 text-center text-slate-400 text-sm">
          Page {currentPage + 1} of {totalPages}
        </p>
      </div>
    </div>
  );
}
