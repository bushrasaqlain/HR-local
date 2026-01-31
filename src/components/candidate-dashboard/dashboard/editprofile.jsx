import Head from "next/head";
import React, { Component } from "react";
// import { FaPencilAlt } from "react-icons/fa"; // Font Awesome pencil
import { FaPencilAlt, FaLinkedin, FaFacebook, FaGithub, FaGlobe } from "react-icons/fa";
import Select, { components } from "react-select";
import {
  Card,
  CardBody,
  Container,
  Button,
  Input,
  Label,
  Progress,
} from "reactstrap";
import api from "../../lib/api";
const CustomOption = (props) => (
  <components.Option {...props}>
    <span style={{ marginRight: 8 }}>{props.data.icon}</span>
    {props.data.label}
  </components.Option>
);

class EditProfile extends Component {
  state = {
    activeStep: 1,
    editableField: null,
    formData: {
    Links: [],
  },
  
    loading: false,
  };
// Add this inside the class but outside any method
  linkOptions = [
    { value: "linkedin", label: "LinkedIn", icon: <FaLinkedin color="#0A66C2" /> },
    { value: "facebook", label: "Facebook", icon: <FaFacebook color="#1877F2" /> },
    { value: "github", label: "GitHub", icon: <FaGithub /> },
    { value: "portfolio", label: "Portfolio", icon: <FaGlobe /> },
    { value: "website", label: "Website", icon: <FaGlobe /> },
  ];
  
  componentDidMount() {
    this.fetchCandidateInfo();
  }

  fetchCandidateInfo = async () => {
    const token = localStorage.getItem("token");
    const res = await api.get("/candidateProfile/candidate", {
      headers: { Authorization: `Bearer ${token}` },
    });
    this.setState({
  formData: {
    ...res.data,
    Links: res.data?.Links || [],
  },
});

  };

  handleEdit = field => {
    this.setState({ editableField: field });
  };

  handleChange = (e, field) => {
    this.setState({
      formData: { ...this.state.formData, [field]: e.target.value },
    });
  };

  handleSave = async () => {
    this.setState({ loading: true });
    const token = localStorage.getItem("token");
    await api.put("/candidateProfile/candidate/editCandidateInfo", this.state.formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    this.setState({ editableField: null, loading: false });
    alert("Profile updated successfully");
  };
addLink = () => {
  this.setState(prev => ({
    formData: {
      ...prev.formData,
      Links: [
        ...(prev.formData.Links || []),
        { type: "", url: "" },
      ],
    },
  }));
};

updateLink = (index, key, value) => {
  const links = [...this.state.formData.Links];
  links[index][key] = value;

  this.setState({
    formData: {
      ...this.state.formData,
      Links: links,
    },
  });
};

removeLink = index => {
  const links = [...this.state.formData.Links];
  links.splice(index, 1);

  this.setState({
    formData: {
      ...this.state.formData,
      Links: links,
    },
  });
};

  renderField(label, field, showEdit = true) {
  const { formData, editableField } = this.state;
  const editing = editableField === field;

  return (
    <div className="mb-0">
      {showEdit && (
        <div className="d-flex justify-content-between align-items-center mb-1">
          <Label className="fw-semibold mb-0">{label}</Label>
          <Button
  color="link"
  className="p-0 text-info"
  onClick={() => this.handleEdit(field)}
  title="Edit"
>
   <FaPencilAlt size={16} />
</Button>

        </div>
      )}

      <Input
        value={formData[field] || ""}
        readOnly={!editing}
        onChange={e => this.handleChange(e, field)}
      />
    </div>
  );
}

renderLinksStep() {
  const { Links } = this.state.formData;

  return (
    <>
      <h5 className="mb-3">Links</h5>

      {(Links || []).map((link, index) => (
        <div key={index} className="border rounded p-3 mb-3">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <Select
  options={this.linkOptions}
  components={{ Option: CustomOption }} // <-- renamed
  value={this.linkOptions.find(o => o.value === link.type) || null}
  onChange={(selected) => this.updateLink(index, "type", selected.value)}
  placeholder="Select Type"
/>

            </div>

            <div className="col-md-7">
              <Input
                placeholder="https://"
                value={link.url}
                onChange={e => this.updateLink(index, "url", e.target.value)}
              />
            </div>

            <div className="col-md-1 text-end">
              <Button
                color="link"
                className="text-danger p-0"
                onClick={() => this.removeLink(index)}
              >
                ✕
              </Button>
            </div>
          </div>
        </div>
      ))}

      <Button color="outline-primary" onClick={this.addLink}>
        + Add Link
      </Button>
    </>
  );
}


  /* ---------------- STEP CONTENT ---------------- */

  renderStepContent() {
    switch (this.state.activeStep) {
      case 1:
        return (
          <>
            <h5>Personal Information</h5>
            {this.renderField("Full Name", "full_name")}
            {this.renderField("Email", "email")}
            {this.renderField("Phone", "phone")}
            {this.renderField("Location", "country")}
            {this.renderField("City", "city")}
            {this.renderField("District", "district")}
            {this.renderField("DOB", "date_of_birth")}
            {this.renderField("Gender", "gender")}
            {this.renderField("Marital Status", "marital_status")}
            {this.renderField("License Type", "license_type")}
            {this.renderField("License No", "license_number")}
            {this.renderField("Current Salary", "current_salary")}
            {this.renderField("Expected Salary", "expected_salary")}
            {this.renderField("Total Experience", "total_experience")}
            {this.renderField("Address", "address")}
          </>
        );
case 2:
  return this.renderLinksStep();

      case 3:
        return (
        
          <>
  <h5>Qualifications</h5>

  <table className="table table-bordered align-middle">
    <thead>
      <tr>
        <th style={{ width: "30%" }}>Field</th>
        <th>Value</th>
        <th style={{ width: "120px" }} className="text-center">
          Action
        </th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td>Highest Degree</td>
        <td>{this.renderField(null, "degreetype", false)}</td>
<td className="text-center">
  <button
    className="btn btn-sm btn-outline-primary"
    onClick={() => this.handleEdit("degreetype")}
  >
    Edit
  </button>
</td>

      </tr>

      <tr>
        <td>Institute</td>
         <td>{this.renderField(null, "institute", false)}</td>
        <td className="text-center">
          <button className="btn btn-sm btn-outline-primary">
            Edit
          </button>
        </td>
      </tr>

      <tr>
        <td>Passing Year</td>
        <td>{this.renderField(null,  "passing_year", false)}</td>
        <td className="text-center">
          <button className="btn btn-sm btn-outline-primary">
            Edit
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</>

        );

      case 4:
        return (
           <>
            <h5>Preferences</h5>
            {this.renderField("Desired Job Title", "desired_job_title")}
            {this.renderField("Job Type", "job_type")}
            {this.renderField("Work Schedule", "work_schedule")}
          </>
        );

      case 5:
        return (
          <>
            <h5>Experience</h5>
            {this.renderField("Total Experience", "total_experience")}
            {this.renderField("Last Company", "last_company")}
            {this.renderField("Last Designation", "last_designation")}
          </>
        );

      case 6:
        return (
          <>
            <h5>Review</h5>
            {this.renderField("Summary", "profile_summary")}
          </>
        );

      default:
        return null;
    }
  }

  render() {
    const steps = [
      "Personal Info",
      "Links",
      "Qualifications",
      "Experience",
      "Resume",
      "Availability",
    ];

    return (
      <Container fluid className="py-4">
        <Head>
          <title>Edit Profile</title>
        </Head>

        <div className="row">
          {/* ---------- LEFT STEPPER ---------- */}
          <div className="col-md-3 mb-3">
            <Card className="shadow-sm">
              <CardBody>
                <h6>Profile Completion</h6>
                <Progress value={25} className="mb-4" />

                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`mb-3 cursor-pointer ${
                      this.state.activeStep === index + 1
                        ? "fw-bold text-primary"
                        : "text-muted"
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      this.setState({ activeStep: index + 1 })
                    }
                  >
                    {index + 1}. {step}
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          {/* ---------- RIGHT CONTENT ---------- */}
          <div className="col-md-9">
            <Card className="shadow-sm">
              <CardBody>
                {this.renderStepContent()}

                <div className="text-end mt-4">
                  <Button
                    color="primary"
                    onClick={this.handleSave}
                    disabled={this.state.loading}
                  >
                    {this.state.loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </Container>
    );
  }
}

export default EditProfile;
