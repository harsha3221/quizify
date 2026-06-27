import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../config";

export default function QuizAIInsights({ quizId: propQuizId }) {
  const { quizId: urlQuizId } = useParams();
  const quizId = propQuizId || urlQuizId;

  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateInsights = async () => {
    if (!quizId) {
      setError("Quiz ID not found. Please refresh or try again.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/analytics/ai-report/${quizId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      console.error("AI Analysis Error:", err);
      setError(
        err.message ||
          "Failed to generate AI report. Check console for details.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="ai-loading-state">
        <div className="loader"></div>
        <p>🤖 AI is cross-referencing skips and wrong answers...</p>
      </div>
    );

  return (
    <div className="ai-analytics-wrapper">
      {!insights ? (
        <div className="ai-init-view">
          <button className="ai-btn-primary" onClick={generateInsights}>
            ✨ Run AI Performance Analysis
          </button>
          {error && (
            <p
              className="error-msg"
              style={{ color: "red", marginTop: "10px" }}
            >
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="ai-report-dashboard">
          <header className="report-header">
            <h3>📊 Intelligence Report</h3>
            {/* Safe fallback if the summary text field is null/missing */}
            <p className="summary-text">
              {insights?.summary ?? "No summary provided by AI."}
            </p>
          </header>

          <div className="insight-grid">
            <div className="card gap-card">
              <h4 style={{ color: "#f0ad4e" }}>⚠️ Concept Gaps (Confusion)</h4>
              <ul>
                {/* Fallback to empty array if topicsToImprove is missing/null */}
                {(insights?.topicsToImprove || []).map((topic, i) => (
                  <li key={i}>{topic ?? "Unknown concept"}</li>
                ))}
                {(insights?.topicsToImprove || []).length === 0 && (
                  <li>No significant conceptual gaps identified!</li>
                )}
              </ul>
            </div>

            <div className="card void-card">
              <h4 style={{ color: "#d9534f" }}>
                🚫 Knowledge Voids (Unattempted)
              </h4>
              <ul>
                {/* Fallback to empty array if knowledgeVoids is missing/null */}
                {(insights?.knowledgeVoids || []).map((topic, i) => (
                  <li key={i}>{topic ?? "Unknown topic"}</li>
                ))}
                {(insights?.knowledgeVoids || []).length === 0 && (
                  <li>No knowledge voids detected.</li>
                )}
              </ul>
            </div>
          </div>

          <div className="card full-width">
            <h4>🔥 Critical Questions Analysis</h4>
            <div className="question-analysis-list">
              {/* Fallback array + inner key string defaults */}
              {(insights?.hardQuestions || []).map((item, i) => (
                <div key={i} className="analysis-item">
                  <strong>Question:</strong>{" "}
                  {item?.question ?? "Question text missing"}
                  <p>
                    <strong>AI Verdict:</strong>{" "}
                    {item?.reason ?? "No verdict description provided."}
                  </p>
                </div>
              ))}
              {(insights?.hardQuestions || []).length === 0 && (
                <p>No critical question anomalies found.</p>
              )}
            </div>
          </div>

          <div className="card strategy-card full-width">
            <h4>💡 Recommended Reteaching Strategy</h4>
            {/* Safe string default fallback */}
            <p className="strategy-p">
              {insights?.suggestions ??
                "No strategic recommendations available."}
            </p>
            <button className="btn-outline" onClick={() => setInsights(null)}>
              Re-Analyze Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
