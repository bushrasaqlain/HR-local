"use client";
import React, { Component } from "react";
import axios from "axios";
import Head from "next/head";
import { Container, Row, Col, Input, Button } from "reactstrap";

const BRAND = "#36565f";

class ScreeningQuestionsForm extends Component {
  constructor(props) {
    super(props);
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    this.userId = typeof window !== "undefined" ? sessionStorage.getItem("userId") : null;
    this.state = {
      questions: [],
      jobTitle: props.jobTitle || "",
      loading: true,
      saving: false,
      error: null,
    };
  }

  componentDidMount() {
    this.loadQuestions();
    if (!this.state.jobTitle) this.loadJobTitle();
  }

  loadJobTitle = async () => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}job/managejob/${this.userId}`);
      const job = (res.data || []).find((j) => String(j.id) === String(this.props.jobId));
      if (job) this.setState({ jobTitle: job.job_title });
    } catch (err) { console.error(err); }
  };

  loadQuestions = async () => {
    try {
      const res = await axios.get(`${this.apiBaseUrl}jobs/${this.props.jobId}/screening-questions`);
      const questions = res.data.questions?.length
        ? res.data.questions.map((q) => ({
            id: q.id, question_text: q.question_text, question_type: q.question_type,
            options: q.options || [], is_required: !!q.is_required,
          }))
        : [];
      this.setState({ questions, loading: false });
    } catch (err) { console.error(err); this.setState({ loading: false }); }
  };

  addQuestion = () => this.setState((p) => ({
    questions: [...p.questions, { question_text: "", question_type: "text", options: [], is_required: true }],
  }));

  removeQuestion = (i) => this.setState((p) => ({ questions: p.questions.filter((_, idx) => idx !== i) }));

  updateQuestion = (i, field, value) => this.setState((p) => {
    const questions = [...p.questions];
    questions[i] = { ...questions[i], [field]: value };
    return { questions };
  });

  updateOption = (qi, oi, value) => this.setState((p) => {
    const questions = [...p.questions];
    const options = [...(questions[qi].options || [])];
    options[oi] = value;
    questions[qi] = { ...questions[qi], options };
    return { questions };
  });

  addOption = (qi) => this.setState((p) => {
    const questions = [...p.questions];
    questions[qi] = { ...questions[qi], options: [...(questions[qi].options || []), ""] };
    return { questions };
  });

  removeOption = (qi, oi) => this.setState((p) => {
    const questions = [...p.questions];
    questions[qi] = { ...questions[qi], options: (questions[qi].options || []).filter((_, idx) => idx !== oi) };
    return { questions };
  });

  validate = () => {
    for (const q of this.state.questions) {
      if (!q.question_text?.trim()) return "All questions need text.";
      if (q.question_type === "multiple_choice" && (!q.options || q.options.filter((o) => o.trim()).length < 2))
        return "Multiple choice questions need at least 2 options.";
    }
    return null;
  };

  handleSave = async () => {
    const validationError = this.validate();
    if (validationError) return this.setState({ error: validationError });
    this.setState({ saving: true, error: null });
    try {
      const payload = {
        userId: this.userId,
        questions: this.state.questions.map((q) => ({
  id: q.id, // undefined for new questions — that's fine, backend treats it as insert
  question_text: q.question_text.trim(),
  question_type: q.question_type,
  options: q.question_type === "multiple_choice" ? q.options.filter((o) => o.trim()) : null,
  is_required: q.is_required,
})),
      };
      await axios.post(`${this.apiBaseUrl}jobs/${this.props.jobId}/screening-questions`, payload);
      this.setState({ saving: false });
      if (this.props.onSaved) this.props.onSaved();
    } catch (err) {
      console.error(err);
      this.setState({ saving: false, error: "Failed to save questions. Please try again." });
    }
  };

  handleClearAll = async () => {
    if (!window.confirm("Remove all screening questions for this job? Candidates will be able to apply with one click.")) return;
    this.setState({ saving: true });
    try {
      await axios.post(`${this.apiBaseUrl}jobs/${this.props.jobId}/screening-questions`, { userId: this.userId, questions: [] });
      this.setState({ questions: [], saving: false });
    } catch (err) { console.error(err); this.setState({ saving: false }); }
  };

  render() {
    const { questions, jobTitle, loading, saving, error } = this.state;
    const answerable = questions.filter((q) => q.question_text?.trim());

    return (
      <div style={{ minHeight: "100vh", background: "#f4f7f7" }}>
        <Head><title>Screening Questions{jobTitle ? ` · ${jobTitle}` : ""}</title></Head>

        <Container fluid className="px-3 px-md-4 py-4" style={{ maxWidth: 1180 }}>
          <div className="text-secondary small mb-3" style={{ cursor: "pointer", width: "fit-content" }} onClick={() => this.props.onBack?.()}>
            ← Back to job
          </div>

          <div className="mb-4">
            <div className="text-uppercase small fw-semibold mb-1" style={{ color: "#c9822a", letterSpacing: "0.05em" }}>
              Screening Questions
            </div>
            <h4 className="fw-bold mb-1" style={{ color: BRAND }}>{jobTitle || "Set up your application questions"}</h4>
            <p className="text-secondary small mb-0" style={{ maxWidth: 480 }}>
              Ask candidates to answer a few questions before they can apply. Leave this empty for a one-click apply.
            </p>
          </div>

          {loading ? (
            <div className="bg-white rounded-3 shadow-sm p-5 text-center text-secondary">Loading…</div>
          ) : (
            <Row className="g-3">
              {/* Builder */}
              <Col xs={12} lg={7}>
                <div className="bg-white rounded-3 shadow-sm">
                  <div className="border-bottom px-3 px-md-4 py-3 fw-semibold" style={{ color: BRAND }}>
                    Questions ({questions.length})
                  </div>
                  <div className="p-3 p-md-4">
                    {error && <div className="alert alert-danger small py-2">{error}</div>}

                    {questions.length === 0 && (
                      <div className="text-center text-secondary small py-4">
                        No questions yet. Add one below, or leave this page as-is for a one-click apply.
                      </div>
                    )}

                    {questions.map((q, qi) => (
                      <div key={qi} className="border rounded-3 p-3 mb-3" style={{ background: "#fcfdfd" }}>
                        <Row className="g-2 align-items-center mb-2">
                          <Col xs="auto">
                            <span className="badge rounded-pill" style={{ background: "#e8f0f1", color: BRAND }}>
                              Q{qi + 1}
                            </span>
                          </Col>
                          <Col xs={12} sm>
                            <Input
                              type="text"
                              placeholder="Type your question…"
                              value={q.question_text}
                              onChange={(e) => this.updateQuestion(qi, "question_text", e.target.value)}
                            />
                          </Col>
                          <Col xs={8} sm={4} md={3}>
                            <Input
                              type="select"
                              value={q.question_type}
                              onChange={(e) => this.updateQuestion(qi, "question_type", e.target.value)}
                            >
                              <option value="text">Text answer</option>
                              <option value="yes_no">Yes / No</option>
                              <option value="multiple_choice">Multiple choice</option>
                            </Input>
                          </Col>
                          <Col xs="auto" className="ms-auto">
                            <Button close onClick={() => this.removeQuestion(qi)} aria-label="Remove question" />
                          </Col>
                        </Row>

                        {q.question_type === "multiple_choice" && (
                          <div className="ms-0 ms-sm-4 mb-2">
                            {(q.options || []).map((opt, oi) => (
                              <Row key={oi} className="g-2 mb-2">
                                <Col xs={10} sm={11}>
                                  <Input
                                    bsSize="sm"
                                    type="text"
                                    placeholder={`Option ${oi + 1}`}
                                    value={opt}
                                    onChange={(e) => this.updateOption(qi, oi, e.target.value)}
                                  />
                                </Col>
                                <Col xs={2} sm={1}>
                                  <Button close onClick={() => this.removeOption(qi, oi)} />
                                </Col>
                              </Row>
                            ))}
                            <Button color="link" size="sm" className="p-0" style={{ color: BRAND }} onClick={() => this.addOption(qi)}>
                              + Add option
                            </Button>
                          </div>
                        )}

                        <div className="ms-0 ms-sm-4">
                          <span
                            className="badge rounded-pill"
                            style={{
                              cursor: "pointer",
                              background: q.is_required ? "#faf1e4" : "#f1f4f4",
                              color: q.is_required ? "#8a5713" : "#61787c",
                              border: `1px solid ${q.is_required ? "#ecd3ab" : "#dde5e5"}`,
                            }}
                            onClick={() => this.updateQuestion(qi, "is_required", !q.is_required)}
                          >
                            {q.is_required ? "● Required" : "○ Optional"}
                          </span>
                        </div>
                      </div>
                    ))}

                    <Button outline block style={{ borderColor: BRAND, color: BRAND, borderStyle: "dashed" }} onClick={this.addQuestion}>
                      + Add screening question
                    </Button>

                    <div className="d-flex justify-content-between align-items-center mt-3">
                      {questions.length > 0 ? (
                        <Button outline color="danger" size="sm" disabled={saving} onClick={this.handleClearAll}>
                          Remove all
                        </Button>
                      ) : <span />}
                      <Button style={{ background: BRAND, border: "none" }} disabled={saving} onClick={this.handleSave}>
                        {saving ? "Saving…" : "Save questions"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>

              {/* Live preview */}
              <Col xs={12} lg={5}>
                <div className="rounded-3 p-3 p-md-4" style={{ background: "#223940", position: "sticky", top: 20 }}>
                  <div className="text-uppercase small mb-3" style={{ color: "#9db8bd", letterSpacing: "0.05em" }}>
                    ● How candidates will see this
                  </div>
                  <div className="bg-white rounded-3 p-3 p-md-4 shadow">
                    <h6 className="fw-bold mb-1" style={{ color: BRAND }}>{jobTitle || "Job application"}</h6>
                    <p className="text-secondary small border-bottom pb-3 mb-3">Before you apply, please answer:</p>

                    {answerable.length === 0 && (
                      <p className="text-center small py-4" style={{ color: "#9db8bd" }}>
                        No questions yet — candidates will be able to apply with one click.
                      </p>
                    )}

                    {answerable.map((q, i) => (
                      <div key={i} className="mb-3">
                        <div className="fw-semibold small mb-2">
                          <span className="me-1" style={{ color: BRAND }}>Q{i + 1}</span>
                          {q.question_text}
                          {q.is_required && <span className="ms-1" style={{ color: "#c9822a" }}>*</span>}
                        </div>

                        {q.question_type === "text" && <Input disabled bsSize="sm" />}

                        {q.question_type === "yes_no" && (
                          <div className="d-flex gap-3 small text-secondary">
                            <span><Input type="radio" disabled className="me-1" />Yes</span>
                            <span><Input type="radio" disabled className="me-1" />No</span>
                          </div>
                        )}

                        {q.question_type === "multiple_choice" && (
                          <div className="small text-secondary">
                            {(q.options || []).filter((o) => o.trim()).length === 0 && (
                              <em>Add options to preview choices</em>
                            )}
                            {(q.options || []).filter((o) => o.trim()).map((opt, oi) => (
                              <div key={oi}><Input type="checkbox" disabled className="me-1" />{opt}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Container>
      </div>
    );
  }
}

export default ScreeningQuestionsForm;