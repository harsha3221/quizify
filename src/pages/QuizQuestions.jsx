import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import "../css/quiz-questions.css";
import { useAuth } from "../context/AuthContext";
import imageCompression from "browser-image-compression";
import { API_BASE } from "../config";
import {
  fetchQuizQuestionsApi,
  createQuestionApi,
  updateQuestionApi,
  deleteQuestionApi,
} from "../api/quizQuestions.api";

export default function QuizQuestions() {
  const { quizId } = useParams();
  const { csrfToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [questionText, setQuestionText] = useState("");
  const [marks, setMarks] = useState(1);
  const [options, setOptions] = useState([
    { option_text: "", is_correct: false, image: null, previewUrl: null },
    { option_text: "", is_correct: false, image: null, previewUrl: null },
  ]);
  const [questionImage, setQuestionImage] = useState(null);
  const [questionPreview, setQuestionPreview] = useState(null);

  const [editMode, setEditMode] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState(null);

  // AI state
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [aiNumOptions, setAiNumOptions] = useState(4);
  const [aiNumCorrect, setAiNumCorrect] = useState(1);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiPreview, setAiPreview] = useState(null);

  const compressImage = async (file) => {
    try {
      return await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
    } catch (err) {
      console.error("Compression failed:", err);
      return file;
    }
  };

  const handleFileChange = async (file, type, index = null) => {
    if (!file) return;
    const compressed = await compressImage(file);
    const url = URL.createObjectURL(compressed);

    if (type === "question") {
      if (questionPreview) URL.revokeObjectURL(questionPreview);
      setQuestionImage(compressed);
      setQuestionPreview(url);
    } else {
      setOptions((prev) => {
        const copy = [...prev];
        if (copy[index].previewUrl) URL.revokeObjectURL(copy[index].previewUrl);
        copy[index].image = compressed;
        copy[index].previewUrl = url;
        return copy;
      });
    }
  };

  const uploadToCloudinary = useCallback(
    async (file, folder) => {
      if (!file) return null;
      const sigRes = await fetch(
        `${API_BASE}/quiz/${quizId}/upload-signature?folder=${folder}`,
        { credentials: "include" },
      );
      const { signature, timestamp, apiKey, cloudName } = await sigRes.json();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", signature);
      formData.append("timestamp", timestamp);
      formData.append("api_key", apiKey);
      formData.append("folder", folder);
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );
      const cloudData = await cloudRes.json();
      return cloudData.secure_url;
    },
    [quizId],
  );

  const fetchQuestions = useCallback(
    (isInitialLoad = false) => {
      if (isInitialLoad) setLoading(true);
      fetchQuizQuestionsApi(quizId)
        .then((res) => res.json())
        .then((data) => setQuestions(data.questions || []))
        .catch((err) => console.error("Fetch error:", err.message))
        .finally(() => {
          if (isInitialLoad) setLoading(false);
        });
    },
    [quizId],
  );

  useEffect(() => {
    fetchQuestions(true);
  }, [fetchQuestions]);

  const resetForm = useCallback(() => {
    if (questionPreview) URL.revokeObjectURL(questionPreview);
    options.forEach((opt) => {
      if (opt.previewUrl) URL.revokeObjectURL(opt.previewUrl);
    });
    setQuestionText("");
    setMarks(1);
    setOptions([
      { option_text: "", is_correct: false, image: null, previewUrl: null },
      { option_text: "", is_correct: false, image: null, previewUrl: null },
    ]);
    setQuestionImage(null);
    setQuestionPreview(null);
    setEditMode(false);
    setEditQuestionId(null);
  }, [options, questionPreview]);

  const startEditing = (q) => {
    resetForm();
    setEditMode(true);
    setEditQuestionId(q.id);
    setQuestionText(q.question_text);
    setMarks(q.marks);
    setQuestionPreview(q.image_url || null);
    setOptions(
      q.options.map((opt) => ({
        option_text: opt.option_text,
        is_correct: opt.is_correct,
        id: opt.id,
        image: null,
        previewUrl: null,
        image_url: opt.image_url || null,
      })),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAiGenerate = async () => {
    if (!aiTopic.trim()) {
      setAiError("Please enter a topic.");
      return;
    }
    setAiError("");
    setAiPreview(null);
    setAiGenerating(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/quiz/${quizId}/ai-generate-question`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({
            topic: aiTopic,
            difficulty: aiDifficulty,
            num_options: aiNumOptions,
            num_correct: aiNumCorrect,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "AI generation failed");
      }
      const data = await res.json();
      setAiPreview(data);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleUseAiQuestion = () => {
    if (!aiPreview) return;
    resetForm();
    setQuestionText(aiPreview.question_text);
    setMarks(1);
    setOptions(
      aiPreview.options.map((opt) => ({
        option_text: opt.option_text,
        is_correct: opt.is_correct,
        image: null,
        previewUrl: null,
      })),
    );
    setAiPreview(null);
    setAiPanelOpen(false);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalQuestionImageUrl = editMode
        ? questions.find((q) => q.id === editQuestionId)?.image_url || null
        : null;
      if (questionImage) {
        finalQuestionImageUrl = await uploadToCloudinary(
          questionImage,
          "quiz_questions",
        );
      }
      const updatedOptions = await Promise.all(
        options.map(async (opt) => {
          let url = opt.image_url || null;
          if (opt.image)
            url = await uploadToCloudinary(opt.image, "quiz_options");
          return {
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            image_url: url,
            id: opt.id,
          };
        }),
      );
      const payload = {
        question_text: questionText,
        marks,
        image_url: finalQuestionImageUrl,
        options: updatedOptions,
      };
      const res = editMode
        ? await updateQuestionApi(quizId, editQuestionId, payload, csrfToken)
        : await createQuestionApi(quizId, payload, csrfToken);
      if (!res.ok) throw new Error("Failed to save data to server");
      resetForm();
      fetchQuestions(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?"))
      return;
    setDeletingId(questionId);
    try {
      const res = await deleteQuestionApi(quizId, questionId, csrfToken);
      if (!res.ok) throw new Error("Failed to delete question");
      fetchQuestions(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <h2>Loading questions...</h2>;

  return (
    <div className="quiz-questions-container">
      <h2>
        {editMode ? "Edit Question" : "Add Question"} to Quiz #{quizId}
      </h2>

      {/* AI PANEL */}
      <div className="ai-panel">
        <button
          type="button"
          className="ai-toggle-btn"
          onClick={() => {
            setAiPanelOpen((prev) => !prev);
            setAiPreview(null);
            setAiError("");
          }}
        >
          🤖 {aiPanelOpen ? "Close AI Generator" : "Generate Question with AI"}
        </button>

        {aiPanelOpen && (
          <div className="ai-panel-body">
            <h3>AI Question Generator</h3>
            <div className="ai-form-grid">
              <div className="ai-field">
                <label>Topic / Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Photosynthesis, World War II, Algebra"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                />
              </div>
              <div className="ai-field">
                <label>Difficulty</label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div className="ai-field">
                <label>Number of Options</label>
                <input
                  type="number"
                  min={2}
                  max={6}
                  value={aiNumOptions}
                  onChange={(e) =>
                    setAiNumOptions(
                      Math.max(2, Math.min(6, Number(e.target.value))),
                    )
                  }
                />
              </div>
              <div className="ai-field">
                <label>Correct Options</label>
                <input
                  type="number"
                  min={1}
                  max={aiNumOptions - 1}
                  value={aiNumCorrect}
                  onChange={(e) =>
                    setAiNumCorrect(
                      Math.max(
                        1,
                        Math.min(aiNumOptions - 1, Number(e.target.value)),
                      ),
                    )
                  }
                />
              </div>
            </div>

            {aiError && <p className="ai-error">⚠️ {aiError}</p>}

            <button
              type="button"
              className="ai-generate-btn"
              onClick={handleAiGenerate}
              disabled={aiGenerating}
            >
              {aiGenerating ? "⏳ Generating..." : "✨ Generate Question"}
            </button>

            {aiPreview && (
              <div className="ai-preview">
                <h4>Generated Question Preview</h4>
                <p className="ai-preview-question">
                  <strong>Q:</strong> {aiPreview.question_text}
                </p>
                <ul className="ai-preview-options">
                  {aiPreview.options.map((opt, i) => (
                    <li key={i} className={opt.is_correct ? "correct" : ""}>
                      {opt.is_correct ? "✅" : "⭕"} {opt.option_text}
                    </li>
                  ))}
                </ul>
                <div className="ai-preview-actions">
                  <button
                    type="button"
                    className="ai-use-btn"
                    onClick={handleUseAiQuestion}
                  >
                    ➕ Add to Editor
                  </button>
                  <button
                    type="button"
                    className="ai-regenerate-btn"
                    onClick={handleAiGenerate}
                    disabled={aiGenerating}
                  >
                    🔄 Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QUESTIONS LIST */}
      <div className="questions-list">
        {questions.map((q) => (
          <div key={q.id} className="question-card">
            <div className="question-header-row">
              <h3>
                Q: {q.question_text} ({q.marks} pts)
              </h3>
              <div className="question-actions">
                <button
                  onClick={() => startEditing(q)}
                  disabled={deletingId === q.id}
                >
                  ✏️ Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteQuestion(q.id)}
                  disabled={deletingId === q.id}
                >
                  {deletingId === q.id ? "🗑 Deleting..." : "🗑 Delete"}
                </button>
              </div>
            </div>
            {q.image_url && (
              <img
                src={q.image_url}
                alt="Question"
                className="question-image"
                style={{ maxWidth: "200px" }}
              />
            )}
            <ul>
              {q.options.map((opt) => (
                <li key={opt.id}>
                  {opt.is_correct ? "✅" : "⭕"} {opt.option_text}
                  {opt.image_url && (
                    <img
                      src={opt.image_url}
                      alt="opt"
                      style={{ width: "40px", marginLeft: "10px" }}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="add-question-form">
        <textarea
          placeholder="Question text..."
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          required
        />
        <div className="form-row">
          <label>Marks: </label>
          <input
            type="number"
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
          />
          <label>Question Image: </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files[0], "question")}
          />
          {questionPreview && (
            <img
              src={questionPreview}
              alt="Preview"
              style={{ width: "50px", height: "50px", objectFit: "cover" }}
            />
          )}
        </div>

        <div className="options-container">
          {options.map((opt, i) => (
            <div key={i} className="option-row">
              <input
                value={opt.option_text}
                onChange={(e) => {
                  const copy = [...options];
                  copy[i].option_text = e.target.value;
                  setOptions(copy);
                }}
                placeholder={`Option ${i + 1}`}
                required
              />
              <label>
                <input
                  type="checkbox"
                  checked={opt.is_correct}
                  onChange={() => {
                    const copy = [...options];
                    copy[i].is_correct = !copy[i].is_correct;
                    setOptions(copy);
                  }}
                />{" "}
                Correct
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleFileChange(e.target.files[0], "option", i)
                }
              />
              {opt.previewUrl && (
                <img
                  src={opt.previewUrl}
                  alt="opt preview"
                  style={{ width: "36px", height: "36px", objectFit: "cover" }}
                />
              )}
              <button
                type="button"
                onClick={() =>
                  setOptions(options.filter((_, idx) => idx !== i))
                }
              >
                ✖
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setOptions([
                ...options,
                {
                  option_text: "",
                  is_correct: false,
                  image: null,
                  previewUrl: null,
                },
              ])
            }
          >
            ➕ Add Option
          </button>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving || deletingId !== null}>
            {saving
              ? "Saving..."
              : editMode
                ? "Update Question"
                : "Save Question"}
          </button>
          {editMode && (
            <button type="button" onClick={resetForm} disabled={saving}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
