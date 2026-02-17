import React, { Component } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import api from "../../lib/api";

class AvailabilityStep extends Component {
  state = {
    availability: [],
    loading: false,

    showModal: false,
    editIndex: null,

    dayOptions: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],

    shiftOptions: ["morning", "evening", "night"],

    form: {
      day: "",
      shift: "",
      startTime: "",
      endTime: "",
    },
  };

  componentDidMount() {
    this.loadAvailability();
  }

  loadAvailability = async () => {
    try {
      this.setState({ loading: true });
      const res = await api.get("/candidate_availability/getavailability");
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      this.setState({ availability: data, loading: false });
    } catch (err) {
      console.error("Failed to load availability:", err);
      this.setState({ loading: false });
    }
  };

  /* ---------- MODAL HANDLERS ---------- */

  openAddModal = () => {
    this.setState({
      showModal: true,
      editIndex: null,
      form: { day: "", shift: "", startTime: "", endTime: "" },
    });
  };

  /* ---------- OPEN MODAL ---------- */
  openEditModal = (index) => {
    const item = this.state.availability[index];

    this.setState({
      showModal: true,
      editIndex: index,
      form: {
        id: item.id, // ✅ Include DB id for update
        day: item.day || "",
        shift: item.shift || "",
        startTime: item.startTime || "",
        endTime: item.endTime || "",
      },
    });
  };

  openAddModal = () => {
    this.setState({
      showModal: true,
      editIndex: null,
      form: { day: "", shift: "", startTime: "", endTime: "" },
    });
  };

  /* ---------- SAVE ---------- */
  handleSave = async () => {
    const { editIndex, form } = this.state;

    try {
      if (editIndex !== null) {
        // EDIT -> only send single row
        await api.put(
          `/candidate_availability/updateavailability/${form.id}`,
          form,
        );
      } else {
        // ADD -> wrap in array
        await api.post("/candidate_availability/addavailability", {
          availability: [form],
        });
      }

      this.setState({ showModal: false });
      this.loadAvailability();
      alert("Availability saved successfully!");
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save availability");
    }
  };

  closeModal = () => {
    this.setState({
      showModal: false,
      editIndex: null,
      form: {
        day: "",
        shift: "",
        startTime: "",
        endTime: "",
      },
    });
  };

  handleFormChange = (field, value) => {
    this.setState({
      form: { ...this.state.form, [field]: value },
    });
  };

  /* ---------- RENDER ---------- */

  render() {
    const { availability, loading, showModal, form, editIndex, dayOptions } =
      this.state;

    return (
      <>
        <h5 className="mb-3">Availability</h5>

        <Button
          color="outline-primary"
          className="mb-3"
          onClick={this.openAddModal}
        >
          + Add Availability
        </Button>

        {loading && <p>Loading availability…</p>}

        <Table bordered className="align-middle">
          <thead>
            <tr>
              <th>Day</th>
              <th>Shift</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th style={{ width: "120px" }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {availability.length > 0 ? (
              availability.map((item, index) => (
                <tr key={index}>
                  <td>{item.day}</td>
                  <td>{item.shift}</td>
                  <td>{item.startTime}</td>
                  <td>{item.endTime}</td>
                  <td>
                    <Button
                      size="sm"
                      color="outline-primary"
                      onClick={() => this.openEditModal(index)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  No availability added
                </td>
              </tr>
            )}
          </tbody>
        </Table>

        {/* ---------- MODAL ---------- */}
        <Modal isOpen={showModal} toggle={this.closeModal}>
          <ModalHeader toggle={this.closeModal}>
            {editIndex !== null ? "Edit Availability" : "Add Availability"}
          </ModalHeader>

          <ModalBody>
            <div className="mb-2">
              <label>Day</label>
              <Input
                type="select"
                value={form.day}
                onChange={(e) => this.handleFormChange("day", e.target.value)}
              >
                <option value="">Select Day</option>
                {this.state.dayOptions.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </Input>
            </div>

            <div className="mb-2">
              <label>Shift</label>
              <Input
                type="select"
                value={form.shift}
                onChange={(e) => this.handleFormChange("shift", e.target.value)}
              >
                <option value="">Select Shift</option>
                {this.state.shiftOptions.map((shift) => (
                  <option key={shift} value={shift}>
                    {shift.charAt(0).toUpperCase() + shift.slice(1)}
                  </option>
                ))}
              </Input>
            </div>

            <div className="mb-2">
              <label>Start Time</label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  this.handleFormChange("startTime", e.target.value)
                }
              />
            </div>

            <div className="mb-2">
              <label>End Time</label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) =>
                  this.handleFormChange("endTime", e.target.value)
                }
              />
            </div>
          </ModalBody>

          <ModalFooter>
            <Button color="secondary" onClick={this.closeModal}>
              Cancel
            </Button>
            <Button
              color="primary"
              disabled={
                !form.day || !form.shift || !form.startTime || !form.endTime
              }
              onClick={this.handleSave}
            >
              Save
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

export default AvailabilityStep;
