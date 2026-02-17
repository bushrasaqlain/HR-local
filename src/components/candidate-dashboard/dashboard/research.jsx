import React, { Component } from "react";
import AsyncSelect from "react-select/async";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button, Input } from "reactstrap";
import api from "../../lib/api";

class ResearchStep extends Component {
  state = {
    research: [],
    showResearchModal: false,
    newResearch: { title: "", link: "", file: null, filePreviewUrl: "" },
    editIndex: null, // <-- add this
    errors: [],
  };

  componentDidMount() {
    this.loadResearches();
  }

  loadResearches = async () => {
    try {
      const res = await api.get("/candidateResearch/getresearch", {
        params: { status: "Active" },
      });
      const researches = Array.isArray(res.data?.data) ? res.data.data : [];
      this.setState({
        research: researches.map((r) => ({
          id: r.id,
          title: r.research_title,
          link: r.research_link || "",
          file: null,
          hasExistingFile: !!r.document_path,
          filePreviewUrl: r.document_path
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/uploads/research/${r.document_path.split("\\").pop()}`
            : "",
        })),
      });
    } catch (err) {
      console.error("Failed to load research:", err);
    }
  };
  openEditResearchModal = (index) => {
    const item = this.state.research[index];
    this.setState({
      showResearchModal: true,
      editIndex: index,
      newResearch: {
        id: item.id,
        title: item.title || "",
        link: item.link || "",
        file: null, // new file if user wants to replace
        filePreviewUrl: item.filePreviewUrl || "",
      },
    });
  };

  handleResearchFileChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE_MB = 10;
    if (file.size / 1024 / 1024 > MAX_SIZE_MB) {
      toast.error(`File size exceeds ${MAX_SIZE_MB} MB`);
      return;
    }

    const research = [...this.state.research];
    research[index].file = file;
    research[index].filePreviewUrl = URL.createObjectURL(file);

    this.setState({ research });
  };

  handleAddResearch = () => {
    this.setState({
      showResearchModal: true,
      newResearch: { title: "", link: "", file: null, filePreviewUrl: "" },
    });
  };

  handleSaveResearch = async () => {
    const { newResearch, editIndex } = this.state;

    if (!newResearch.title) {
      toast.error("Title is required");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("research_title", newResearch.title);
      formData.append("research_link", newResearch.link || "");
      if (newResearch.file) formData.append("file", newResearch.file);

      if (editIndex !== null) {
        // UPDATE mode
        await api.put(
          `/candidateResearch/updateresearch/${newResearch.id}`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        toast.success("Research updated");
      } else {
        // ADD mode
        await api.post("/candidateResearch/addresearch", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Research added");
      }

      this.setState({
        showResearchModal: false,
        newResearch: {},
        editIndex: null,
      });
      this.loadResearches();
    } catch (err) {
      console.error("Failed to save research:", err);
      toast.error("Failed to save research");
    }
  };

  render() {
    const { research, showResearchModal, newResearch } = this.state;

    return (
      <div className="table-responsive">
        <h5 className="mb-3">Research</h5>

        <table className="table table-bordered align-middle">
          <thead>
            <tr>
              <th>Title</th>
              <th>Link</th>
              <th>Document</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {research.length > 0 ? (
              research.map((item, index) => (
                <tr key={index}>
                  <td>{item.title || "-"}</td>
                  <td>
                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.link}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {item.filePreviewUrl ? (
                      <a
                        href={item.filePreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View File
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <Button
                      size="sm"
                      color="outline-primary"
                      onClick={() => this.openEditResearchModal(index)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center text-muted">
                  No research added
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Button color="outline-primary" onClick={this.handleAddResearch}>
          + Add Research
        </Button>

        {showResearchModal && (
          <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Research</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => this.setState({ showResearchModal: false })}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label>Title</label>
                    <Input
                      value={newResearch.title}
                      onChange={(e) =>
                        this.setState({
                          newResearch: {
                            ...newResearch,
                            title: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label>Link</label>
                    <Input
                      value={newResearch.link}
                      onChange={(e) =>
                        this.setState({
                          newResearch: { ...newResearch, link: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label>Document</label>

                    {/* Show existing file link if available */}
                    {newResearch.filePreviewUrl && !newResearch.file && (
                      <div className="mb-1">
                        <a
                          href={newResearch.filePreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Existing File
                        </a>
                      </div>
                    )}

                    <Input
                      type="file"
                      style={{
                        borderColor: this.state.fileError ? "red" : undefined,
                      }}
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        const MAX_SIZE_MB = 10;
                        if (file.size / 1024 / 1024 > MAX_SIZE_MB) {
                          this.setState({
                            fileError: `File exceeds ${MAX_SIZE_MB} MB`,
                            newResearch: { ...newResearch, file: null },
                          });
                        } else {
                          this.setState({
                            newResearch: {
                              ...newResearch,
                              file,
                              filePreviewUrl: URL.createObjectURL(file),
                            },
                            fileError: null,
                          });
                        }
                      }}
                    />

                    {/* Error message */}
                    {this.state.fileError && (
                      <small className="text-danger">
                        {this.state.fileError}
                      </small>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <Button
                    color="secondary"
                    onClick={() => this.setState({ showResearchModal: false })}
                  >
                    Cancel
                  </Button>
                  <Button color="primary" onClick={this.handleSaveResearch}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default ResearchStep;
