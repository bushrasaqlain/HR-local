import React from "react";
import { FormGroup, Label, Input } from "reactstrap";

class ApplicantFilters extends React.Component {
  state = {
    showAllSkills: false,
    selectedAvailability: { day: "", shift: "" },
  };

  handleAvailabilityChange = (field, value) => {
    this.setState(
      (prev) => ({
        selectedAvailability: {
          ...prev.selectedAvailability,
          [field]: value,
        },
      }),
      () => {
        this.props.onChange("availability", this.state.selectedAvailability);
      }
    );
  };

  render() {
    const {
      counts,
      selectedTabIndex,
      selectedSkillId,
      selectedspecialityId,
      speciality,
      skills,
      onChange,
      selectedSalary,
      selectedExperience,
      selectedCountryId,
      selectedDistrictId,
      selectedCityIds,
      countries,
      districts,
      cities,
    } = this.props;

    const { selectedAvailability } = this.state;

    const shiftOptions = [
      { value: "morning", label: "Morning" },
      { value: "evening", label: "Evening" },
      { value: "night", label: "Night" },
    ];

    const dayOptions = [
      { value: "Monday", label: "Monday" },
      { value: "Tuesday", label: "Tuesday" },
      { value: "Wednesday", label: "Wednesday" },
      { value: "Thursday", label: "Thursday" },
      { value: "Friday", label: "Friday" },
      { value: "Saturday", label: "Saturday" },
      { value: "Sunday", label: "Sunday" },
    ];

    return (
      <div className="p-3 border rounded bg-white">
        <h5 className="mb-3">Filters</h5>

        {/* Status */}
        <FormGroup>
          <Label>Status</Label>
          <Input
            type="select"
            value={selectedTabIndex}
            onChange={(e) => onChange("selectedTabIndex", Number(e.target.value))}
          >
            <option value={0}>All ({counts.all})</option>
            <option value={1}>Pending ({counts.pending})</option>
            <option value={2}>Shortlisted ({counts.shortlisted})</option>
            <option value={3}>Rejected ({counts.rejected})</option>
            <option value={4}>Approved ({counts.approved})</option>
          </Input>
        </FormGroup>

        {/* Speciality */}
        <FormGroup>
          <Label>Speciality</Label>
          <Input
            type="select"
            value={selectedspecialityId || ""}
            onChange={(e) => onChange("selectedspecialityId", e.target.value)}
          >
            <option value="">All Speciality</option>
            {speciality.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </Input>
        </FormGroup>

        {/* Salary */}
        <FormGroup>
          <Label>Salary Range</Label>
          <div className="d-flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={selectedSalary?.min || ""}
              onChange={(e) =>
                onChange("selectedSalary", {
                  ...selectedSalary,
                  min: Number(e.target.value),
                })
              }
            />
            <Input
              type="number"
              placeholder="Max"
              value={selectedSalary?.max || ""}
              onChange={(e) =>
                onChange("selectedSalary", {
                  ...selectedSalary,
                  max: Number(e.target.value),
                })
              }
            />
          </div>
        </FormGroup>

        {/* Experience */}
   {/* Experience */}
<FormGroup>
  <Label>Experience (yrs)</Label>
  <div className="d-flex gap-2">
    <Input
      type="number"
      placeholder="Min"
      value={selectedExperience?.min ?? ""}
      onChange={(e) =>
        onChange("selectedExperience", {
          ...(selectedExperience || {}),
          min: e.target.value === "" ? "" : Number(e.target.value) // convert to number immediately
        })
      }
    />
    <Input
      type="number"
      placeholder="Max"
      value={selectedExperience?.max ?? ""}
      onChange={(e) =>
        onChange("selectedExperience", {
          ...(selectedExperience || {}),
          max: Number(e.target.value) || 0, // convert to number immediately
        })
      }
    />
  </div>
</FormGroup>

        {/* Availability */}
        <FormGroup>
          <Label>Availability</Label>
          <div className="d-flex gap-2">
            <Input
              type="select"
              value={selectedAvailability.day}
              onChange={(e) => this.handleAvailabilityChange("day", e.target.value)}
            >
              <option value="">Day</option>
              {dayOptions.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </Input>

            <Input
              type="select"
              value={selectedAvailability.shift}
              onChange={(e) => this.handleAvailabilityChange("shift", e.target.value)}
            >
              <option value="">Shift</option>
              {shiftOptions.map((shift) => (
                <option key={shift.value} value={shift.value}>
                  {shift.label}
                </option>
              ))}
            </Input>
          </div>
        </FormGroup>

        {/* Skills */}
        <FormGroup>
          <Label>Skills</Label>
          <Input
            type="select"
            value={selectedSkillId || ""}
            onChange={(e) => onChange("selectedSkillId", e.target.value)}
          >
            <option value="">Select Skill</option>
            {skills.map((skill) => (
              <option key={skill.id} value={String(skill.id)}>
                {skill.name}
              </option>
            ))}
          </Input>
        </FormGroup>

        {/* Location Filters */}
        <FormGroup>
          <Label>Country</Label>
          <Input
            type="select"
            value={selectedCountryId || ""}
            onChange={(e) => onChange("selectedCountryId", e.target.value)}
          >
            <option value="">Select Country</option>
            {countries.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </Input>
        </FormGroup>

        {selectedCountryId && (
          <FormGroup>
            <Label>District</Label>
            <Input
              type="select"
              value={selectedDistrictId || ""}
              onChange={(e) => onChange("selectedDistrictId", e.target.value)}
            >
              <option value="">Select District</option>
              {districts.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.name}
                </option>
              ))}
            </Input>
          </FormGroup>
        )}

        {selectedDistrictId && (
          <FormGroup>
            <Label>City</Label>
            {cities.length === 0 && <p className="text-muted small">Select a district first</p>}
            {cities.map((city) => (
              <FormGroup check key={city.id}>
                <Label check>
                  <Input
                    type="checkbox"
                    value={String(city.id)}
                    checked={selectedCityIds?.includes(String(city.id))}
                    onChange={(e) => {
                      const cityId = e.target.value;
                      const checked = e.target.checked;
                      let updatedCities = [...selectedCityIds];
                      if (checked) updatedCities.push(cityId);
                      else updatedCities = updatedCities.filter((id) => id !== cityId);
                      onChange("selectedCityIds", updatedCities);
                    }}
                  />
                  {city.name}
                </Label>
              </FormGroup>
            ))}
          </FormGroup>
        )}
      </div>
    );
  }
}

export default ApplicantFilters;