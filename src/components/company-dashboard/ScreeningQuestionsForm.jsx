"use client";
import React, { Component } from "react";
import axios from "axios";

const BLUE = "#36565f";
const BORDER = "#d1d5db";
const RED = "#dc2626";
const TEXT_SECONDARY = "#6b7280";

const s = {
  input: {
    height: "40px",
    padding: "0 12px",
    fontSize: "13px",
    border: `1.5px solid ${BORDER}`,
    borderRadius: "8px",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  },
  select: {
    height: "40px",
    padding: "0 10px",
    fontSize: "13px",
    border: `1.5px solid ${BORDER}`,
    borderRadius: "8px",
    fontFamily: "inherit",
    background: "#fff",
  },
  btnPrimary: {
    height: "40px",
    padding: "0 20px",
    background: BLUE,
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnGhost: {
    height: "40px",
    padding: "0 16px",
    background: "transparent",
    color: TEXT_SECONDARY,
    border: `1.5px solid ${BORDER}`,
    borderRadius: "8px",
    fontSize: "13px",
    cursor: "pointer",
  },
  btnRemove: {
    background: "none",
    border: "none",
    color: RED,
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: 1,
    padding: "0 4px",
  },
  questionCard: {
    border: `1px solid #e5e7eb`,
    borderRadius: "10px",
    padding: "14px",
    marginBottom: "12px",
    background: "#fafafa",
  },
};

class ScreeningQuestionsForm extends Component {
  constructor(props) {
    super(props);
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    this.userId =
      typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;

    this.state = {
      questions: [],
      loading: true,
      saving: false,
      error: null,
    };
  }

  componentDidMount() {
    this.loadQuestions();
  }

  loadQuestions = async () => {
    try {
      const res = await axios.get(
        `${this.apiBaseUrl}jobs/${this.props.jobId}/screening-questions`
      );
      const questions = res.data.questions?.length
        ? res.data.questions.map((q) => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            options: q.options || [],
            is_required: !!q.is_required,
          }))
        : [];
      this.setState({ questions, loading: false });
    } catch (err) {
      console.error("Failed to load screening questions", err);
      this.setState({ loading: false });
    }
  };

  addQuestion = () => {
    this.setState((prev) => ({
      questions: [
        ...prev.questions,
        {
          question_text: "",
          question_type: "text",
          options: [],
          is_required: true,
        },
      ],
    }));
  };

  removeQuestion = (index) => {
    this.setState((prev) => ({
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  updateQuestion = (index, field, value) => {
    this.setState((prev) => {
      const questions = [...prev.questions];
      questions[index] = { ...questions[index], [field]: value };
      return { questions };
    });
  };

  updateOption = (qIndex, optIndex, value) => {
    this.setState((prev) => {
      const questions = [...prev.questions];
      const options = [...(questions[qIndex].options || [])];
      options[optIndex] = value;
      questions[qIndex] = { ...questions[qIndex], options };
      return { questions };
    });
  };

  addOption = (qIndex) => {
    this.setState((prev) => {
      const questions = [...prev.questions];
      const options = [...(questions[qIndex].options || []), ""];
      questions[qIndex] = { ...questions[qIndex], options };
      return { questions };
    });
  };

  removeOption = (qIndex, optIndex) => {
    this.setState((prev) => {
      const questions = [...prev.questions];
      const options = (questions[qIndex].options || []).filter(
        (_, i) => i !== optIndex
      );
      questions[qIndex] = { ...questions[qIndex], options };
      return { questions };
    });
  };

  validate = () => {
    const { questions } = this.state;
    for (const q of questions) {
      if (!q.question_text?.trim()) return "All questions need text.";
      if (
        q.question_type === "multiple_choice" &&
        (!q.options || q.options.filter((o) => o.trim()).length < 2)
      ) {
        return "Multiple choice questions need at least 2 options.";
      }
    }
    return null;
  };

  handleSave = async () => {
    const validationError = this.validate();
    if (validationError) {
      this.setState({ error: validationError });
      return;
    }

    this.setState({ saving: true, error: null });

    try {
      const payload = {
        userId: this.userId,
        questions: this.state.questions.map((q) => ({
          question_text: q.question_text.trim(),
          question_type: q.question_type,
          options:
            q.question_type === "multiple_choice"
              ? q.options.filter((o) => o.trim())
              : null,
          is_required: q.is_required,
        })),
      };

      await axios.post(
        `${this.apiBaseUrl}jobs/${this.props.jobId}/screening-questions`,
        payload
      );

      this.setState({ saving: false });
      if (this.props.onSuccess) this.props.onSuccess();
    } catch (err) {
      console.error("Failed to save screening questions", err);
      this.setState({
        saving: false,
        error: "Failed to save questions. Please try again.",
      });
    }
  };

  handleClearAll = async () => {
    if (!window.confirm("Remove all screening questions for this job? Candidates will be able to apply with one click.")) return;

    this.setState({ saving: true });
    try {
      await axios.post(
        `${this.apiBaseUrl}jobs/${this.props.jobId}/screening-questions`,
        { userId: this.userId, questions: [] }
      );
      this.setState({ questions: [], saving: false });
      if (this.props.onSuccess) this.props.onSuccess();
    } catch (err) {
      console.error("Failed to clear questions", err);
      this.setState({ saving: false });
    }
  };

  render() {
    const { questions, loading, saving, error } = this.state;

    if (loading) {
      return <div style={{ padding: "24px", textAlign: "center", color: TEXT_SECONDARY }}>Loading…</div>;
    }

    return (
      <div>
        <p style={{ fontSize: "13px", color: TEXT_SECONDARY, marginBottom: "16px" }}>
          Add optional questions candidates must answer before applying. Leave empty for quick one-click apply.
        </p>

        {error && (
          <div style={{ background: "#fef2f2", color: RED, padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px" }}>
            {error}
          </div>
        )}

        {questions.map((q, qIndex) => (
          <div key={qIndex} style={s.questionCard}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <input
                type="text"
                placeholder={`Question ${qIndex + 1}`}
                value={q.question_text}
                onChange={(e) => this.updateQuestion(qIndex, "question_text", e.target.value)}
                style={{ ...s.input, flex: 1 }}
              />
              <select
                value={q.question_type}
                onChange={(e) => this.updateQuestion(qIndex, "question_type", e.target.value)}
                style={s.select}
              >
                <option value="text">Text answer</option>
                <option value="yes_no">Yes / No</option>
                <option value="multiple_choice">Multiple choice</option>
              </select>
              <button onClick={() => this.removeQuestion(qIndex)} style={s.btnRemove} title="Remove question">
                ×
              </button>
            </div>

            {q.question_type === "multiple_choice" && (
              <div style={{ marginLeft: "4px" }}>
                {(q.options || []).map((opt, optIndex) => (
                  <div key={optIndex} style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                    <input
                      type="text"
                      placeholder={`Option ${optIndex + 1}`}
                      value={opt}
                      onChange={(e) => this.updateOption(qIndex, optIndex, e.target.value)}
                      style={{ ...s.input, flex: 1, height: "34px" }}
                    />
                    <button onClick={() => this.removeOption(qIndex, optIndex)} style={s.btnRemove}>×</button>
                  </div>
                ))}
                <button
                  onClick={() => this.addOption(qIndex)}
                  style={{ fontSize: "12px", color: BLUE, background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}
                >
                  + Add option
                </button>
              </div>
            )}

            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: TEXT_SECONDARY, marginTop: "8px" }}>
              <input
                type="checkbox"
                checked={q.is_required}
                onChange={(e) => this.updateQuestion(qIndex, "is_required", e.target.checked)}
              />
              Required
            </label>
          </div>
        ))}

        <button
          onClick={this.addQuestion}
          style={{ ...s.btnGhost, marginBottom: "20px", width: "100%" }}
        >
          + Add screening question
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {questions.length > 0 ? (
            <button onClick={this.handleClearAll} disabled={saving} style={{ ...s.btnGhost, color: RED, borderColor: RED }}>
              Remove all
            </button>
          ) : <span />}

          <button onClick={this.handleSave} disabled={saving} style={{ ...s.btnPrimary, opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Save questions"}
          </button>
        </div>
      </div>
    );
  }
}

export default ScreeningQuestionsForm;