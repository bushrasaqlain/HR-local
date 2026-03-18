import React, { Component } from "react";
import { Button, Input } from "reactstrap";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
import api from "../../lib/api";

class CertificatesStep extends Component {
  state = {
    certificates: [],
    showCertificateModal: false,
    newCertificate: { title: "", file: null, filePreviewUrl: "" },
    successMessage: "",
    errorMessage: "",
  };

  componentDidMount() {
    this.loadCertificates();
  }

  loadCertificates = async () => {
    try {
      const res = await api.get("/candidateCertificate/getcertificate"); // adjust endpoint
      const certificates = Array.isArray(res.data?.data) ? res.data.data : [];

      this.setState({
        certificates: certificates.map((c) => ({
          id: c.id,
          title: c.title || "",
          file: null, // user-uploaded file will stay null until changed
          hasExistingFile: !!c.document_path,
          filePreviewUrl: c.document_path
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}/uploads/certificate/${c.document_path.split("\\").pop()}`
            : "",
        })),
      });
    } catch (err) {
      console.error("Failed to load certificates:", err);
    }
  };


  handleCertificateFileChange = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_SIZE_MB = 10;
    if (file.size / 1024 / 1024 > MAX_SIZE_MB) {
      this.setState({ errorMessage: `File size exceeds ${MAX_SIZE_MB} MB` });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }

    const certificates = [...this.state.certificates];
    certificates[index].file = file;
    certificates[index].filePreviewUrl = URL.createObjectURL(file);
    this.setState({ certificates });
  };

  openEditModal = (certRow) => {
    const draft = {
      id: certRow.id,
      title: certRow.title || "",
      file: null, // new file if user chooses to replace
      filePreviewUrl: certRow.filePreviewUrl || "", // existing file preview
    };

    this.setState({
      showCertificateModal: true, // same state as add
      newCertificate: draft,
      fileError: "",
      isEdit: true, // flag to know we are editing
    });
  };

  handleAddCertificate = () => {
    this.setState({
      showCertificateModal: true,
      newCertificate: { title: "", file: null, filePreviewUrl: "" },
      fileError: "",
      isEdit: false,
    });
  };

  // handleSaveCertificate updated to handle both add & edit
  handleSaveCertificate = async () => {
    const { newCertificate, isEdit } = this.state;
    if (!newCertificate.title) {
      this.setState({ errorMessage: "Title is required" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", newCertificate.title);
      if (newCertificate.file) formData.append("file", newCertificate.file);

      if (isEdit && newCertificate.id) {
        // Update API
        await api.put(`/candidateCertificate/updatecertificate/${newCertificate.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        this.setState({ successMessage: "Certificate updated" });
        setTimeout(() => this.setState({ successMessage: "" }), 3000);
      } else {
        // Add API
        await api.post("/candidateCertificate/addcertificate", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        this.setState({ successMessage: "Certificate added" });
        setTimeout(() => this.setState({ successMessage: "" }), 3000);
      }

      this.setState({ showCertificateModal: false, newCertificate: {}, fileError: "" });
      this.loadCertificates();
    } catch (err) {
      console.error(err);
      this.setState({ errorMessage: "Failed to save certificate" });
      setTimeout(() => this.setState({ errorMessage: "" }), 3000);
    }
  };


  render() {
    const { certificates, showCertificateModal, newCertificate } = this.state;

    return (
      <div>

        {this.state.successMessage && (
          <div className="alert alert-success alert-dismissible d-flex align-items-center gap-2" role="alert" style={{ borderRadius: "8px" }}>
            <i className="bi bi-check-circle-fill text-success"></i>
            <span>{this.state.successMessage}</span>
            <button type="button" className="btn-close ms-auto" onClick={() => this.setState({ successMessage: "" })} />
          </div>
        )}
        {this.state.errorMessage && (
          <div className="alert alert-danger alert-dismissible d-flex align-items-center gap-2" role="alert" style={{ borderRadius: "8px" }}>
            <i className="bi bi-x-circle-fill"></i>
            <span>{this.state.errorMessage}</span>
            <button type="button" className="btn-close ms-auto" onClick={() => this.setState({ errorMessage: "" })} />
          </div>
        )}
        <h5>Certificates</h5>

        <table className="table table-bordered align-middle">
          <thead>
            <tr>
              <th>Title</th>
              <th>Document</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {certificates.length > 0 ? (
              certificates.map((item, index) => (
                <tr key={index}>
                  <td>{item.title || "-"}</td>
                  <td>
                    {item.filePreviewUrl ? (
                      <a href={item.filePreviewUrl} target="_blank" rel="noopener noreferrer">
                        View File
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-secondry custom-progress-bar text-white"
                      onClick={() => this.openEditModal(item)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center text-muted">
                  No certificates added
                </td>
              </tr>
            )}
          </tbody>

        </table>

        <Button color="outline-secondry custom-progress-bar text-white" onClick={this.handleAddCertificate}>
          + Add Certificate
        </Button>

        {showCertificateModal && (
          <div className="modal d-block" tabIndex="-1">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {this.state.isEdit ? "Edit Certificate" : "Add Certificate"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => this.setState({ showCertificateModal: false })}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label>Title</label>
                    <Input
                      value={newCertificate.title}
                      onChange={(e) =>
                        this.setState({ newCertificate: { ...newCertificate, title: e.target.value } })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label>Document</label>
                    {newCertificate.filePreviewUrl && !newCertificate.file && (
                      <div className="mb-1">
                        Current file:{" "}
                        <a
                          href={newCertificate.filePreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {newCertificate.filePreviewUrl.split("/").pop()}
                        </a>
                      </div>
                    )}
                    <Input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        const MAX_SIZE_MB = 5;

                        if (!file) return;

                        if (file.size / 1024 / 1024 > MAX_SIZE_MB) {
                          this.setState({
                            newCertificate: { ...newCertificate, file: null, filePreviewUrl: "" },
                            fileError: `File size exceeds ${MAX_SIZE_MB} MB`,
                          });
                        } else {
                          this.setState({
                            newCertificate: {
                              ...newCertificate,
                              file: file,
                              filePreviewUrl: URL.createObjectURL(file),
                            },
                            fileError: "",
                          });
                        }
                      }}
                      className={this.state.fileError ? "is-invalid" : ""}
                    />
                    {this.state.fileError && (
                      <div className="invalid-feedback">{this.state.fileError}</div>
                    )}
                  </div>


                </div>
                <div className="modal-footer">
                  <Button
                    color="secondary"
                    onClick={() => this.setState({ showCertificateModal: false })}
                  >
                    Cancel
                  </Button>
                  <Button className="custom-progress-bar text-white" onClick={this.handleSaveCertificate}>
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

export default CertificatesStep;
