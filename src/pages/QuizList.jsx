import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../css/quiz-list.css";
import { fetchQuizzesBySubjectApi, deleteQuizApi } from "../api/quiz.api";
import { useAuth } from "../context/AuthContext";
import { API_BASE } from "../config";

export default function QuizList() {
  const { subjectId } = useParams();
  const [quizzes, setQuizzes] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(null);
  const { csrfToken } = useAuth();

  useEffect(() => {
    let clockInterval;
    fetch(`${API_BASE}/api/time`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        let currentServerTime = new Date(data.current_time);
        setNow(currentServerTime);
        clockInterval = setInterval(() => {
          currentServerTime = new Date(currentServerTime.getTime() + 1000);
          setNow(currentServerTime);
        }, 1000);
      })
      .catch(() => {
        setNow(new Date());
        clockInterval = setInterval(() => {
          setNow(new Date());
        }, 1000);
      });

    return () => {
      if (clockInterval) clearInterval(clockInterval);
    };
  }, []);

  useEffect(() => {
    setError("");
    fetchQuizzesBySubjectApi(subjectId)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Failed to fetch quizzes");
        }
        return res.json();
      })
      .then((data) => {
        const sanitizedQuizzes = (data.quizzes || []).map((quiz) => {
          const rawStart =
            quiz.start_time && !quiz.start_time.endsWith("Z")
              ? `${quiz.start_time}Z`
              : quiz.start_time;
          const rawEnd =
            quiz.end_time && !quiz.end_time.endsWith("Z")
              ? `${quiz.end_time}Z`
              : quiz.end_time;

          return {
            ...quiz,
            startDateObj: rawStart ? new Date(rawStart) : null,
            endDateObj: rawEnd ? new Date(rawEnd) : null,
          };
        });
        setQuizzes(sanitizedQuizzes);
        setSubjectName(data.subjectName || "Subject");
      })
      .catch((err) => {
        console.error("Error loading quizzes:", err);
        setError(err.message);
      });
  }, [subjectId]);

  const getQuizState = (quiz) => {
    if (!now) return "draft";
    const start = quiz.startDateObj;
    const end = quiz.endDateObj;

    if (end && now > end) return "completed";
    if (start && now >= start && (!end || now <= end)) return "active";
    return "draft";
  };

  const handleDelete = async (quizId) => {
    const confirmDelete = window.confirm(
      "⚠️ Are you sure you want to delete this quiz?\nThis action cannot be undone.",
    );
    if (!confirmDelete) return;

    try {
      const res = await deleteQuizApi(quizId, csrfToken);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to delete quiz");
      }
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <Navbar role="teacher" />
      <div className="quiz-list-container">
        <h2>Quizzes for {subjectName}</h2>
        {error && <p className="error">{error}</p>}
        <Link
          to={`/teacher/subjects/${subjectId}/quizzes/new`}
          className="btn-create"
        >
          ➕ Create New Quiz
        </Link>
        {quizzes.length === 0 ? (
          <p>No quizzes created yet.</p>
        ) : (
          <ul className="quiz-list">
            {quizzes.map((quiz) => {
              const state = getQuizState(quiz);
              return (
                <li key={quiz.id} className="quiz-item">
                  <div>
                    <strong>{quiz.title}</strong>
                    <br />
                    {quiz.startDateObj?.toLocaleString()} →{" "}
                    {quiz.endDateObj?.toLocaleString()}
                    <br />
                    <span className={`quiz-status quiz-status-${state}`}>
                      {state === "draft"
                        ? "Draft (Upcoming)"
                        : state === "active"
                          ? "Active (Running)"
                          : "Completed"}
                    </span>
                  </div>
                  <div className="quiz-actions">
                    {state === "draft" && (
                      <>
                        <Link
                          to={`/teacher/quiz/${quiz.id}/questions`}
                          className="btn-view"
                        >
                          View / Add Questions
                        </Link>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(quiz.id)}
                        >
                          🗑 Delete
                        </button>
                      </>
                    )}
                    {state === "active" && (
                      <>
                        <Link
                          to={`/teacher/quiz/${quiz.id}/questions`}
                          className="btn-view"
                        >
                          View Questions
                        </Link>
                        <Link
                          to={`/teacher/monitoring/${quiz.id}`}
                          className="btn-monitor"
                        >
                          🔴 Live Monitoring
                        </Link>
                      </>
                    )}
                    {state === "completed" && (
                      <>
                        <Link
                          to={`/teacher/quiz/${quiz.id}/results`}
                          className="btn-view"
                        >
                          View Results
                        </Link>
                        <Link
                          to={`/teacher/monitoring/${quiz.id}`}
                          className="btn-monitor"
                        >
                          📊 View Monitoring
                        </Link>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
