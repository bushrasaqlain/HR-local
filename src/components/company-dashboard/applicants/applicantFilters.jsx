import React from "react";
import { FormGroup, Label, Input, Button } from "reactstrap";

class ApplicantFilters extends React.Component {
    state = {
        showAllSkills: false, // controls "More" toggle
        selectedAvailability: {
            day: "",    // selected day
            shift: "",  // selected shift
        },
    };

    toggleShowSkills = () => {
        this.setState({ showAllSkills: !this.state.showAllSkills });
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
            // jobTypes,
            //  selectedJobTypeId,
            onChange
        } = this.props;

        const { showAllSkills, selectedAvailability } = this.state;
        const skillsToShow = showAllSkills ? skills : skills.slice(0, 5); // show first 5 initially
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

                {/* Status Radios */}
                <FormGroup>
                    <Label className="d-block mb-2">Status</Label>
                    {[{ id: 0, label: `All (${counts.all})` }, { id: 1, label: `Pending (${counts.pending})` }, { id: 2, label: `Shortlisted (${counts.shortlisted})` }, { id: 3, label: `Rejected (${counts.rejected})` }, { id: 4, label: `Approved (${counts.approved})` }].map(status => (
                        <FormGroup check key={status.id}>
                            <Label check>
                                <Input
                                    type="radio"
                                    name="status"
                                    value={status.id}
                                    checked={selectedTabIndex === status.id}
                                    onChange={() => onChange("selectedTabIndex", status.id)}
                                />
                                {status.label}
                            </Label>
                        </FormGroup>
                    ))}
                </FormGroup>

                <FormGroup>
                    <Label>Speciality</Label>
                    <Input
                        type="select"
                        value={selectedspecialityId}
                        onChange={(e) => onChange("selectedspecialityId", e.target.value)}
                    >
                        <option value="">All Speciality</option>
                        {speciality.map(s => (
                            <option key={s.id || s.name} value={s.id || s.name}>
                                {s.name}
                            </option>
                        ))}
                    </Input>
                </FormGroup>
                <FormGroup>
                    <Label>Salary Range</Label>

                    <div className="d-flex align-items-center gap-2">
                        {/* Min Salary */}
                        <Input
                            type="range"
                            min={0}
                            max={200000}
                            step={1000}
                            value={this.props.selectedSalary?.min ?? 0}
                            onChange={(e) =>
                                onChange("selectedSalary", {
                                    ...this.props.selectedSalary,
                                    min: Number(e.target.value),
                                })
                            }
                        />

                        <span>Min: {this.props.selectedSalary?.min || 0}</span>
                    </div>

                    <div className="d-flex align-items-center gap-2 mt-2">
                        {/* Max Salary */}
                        <Input
                            type="range"
                            min={0}
                            max={200000}
                            step={1000}
                            value={this.props.selectedSalary?.max ?? 200000}
                            onChange={(e) =>
                                onChange("selectedSalary", {
                                    ...this.props.selectedSalary,
                                    max: Number(e.target.value),
                                })
                            }
                        />

                        <span>Max: {this.props.selectedSalary?.max || 200000}</span>
                    </div>
                </FormGroup>

                <FormGroup>
                    <Label>Availability</Label>

                    {/* Day Select */}
                    <Input
                        type="select"
                        value={selectedAvailability.day}
                        onChange={(e) => this.handleAvailabilityChange("day", e.target.value)}
                        className="mb-2"
                    >
                        <option value="">Select Day</option>
                        {dayOptions.map((day) => (
                            <option key={day.value} value={day.value}>
                                {day.label}
                            </option>
                        ))}
                    </Input>

                    {/* Shift Select */}
                    <Input
                        type="select"
                        value={selectedAvailability.shift}
                        onChange={(e) => this.handleAvailabilityChange("shift", e.target.value)}
                    >
                        <option value="">Select Shift</option>
                        {shiftOptions.map((shift) => (
                            <option key={shift.value} value={shift.value}>
                                {shift.label}
                            </option>
                        ))}
                    </Input>
                </FormGroup>
                <FormGroup>
                    <Label>Country</Label>
                    <Input
                        type="select"
                        value={this.props.selectedCountryId || ""} // keep string
                        onChange={(e) => onChange("selectedCountryId", e.target.value)} // store as string
                    >
                        <option value="">Select Country</option>
                        {this.props.countries?.map(c => (
                            <option key={c.id} value={String(c.id)}>{c.name}</option> // cast option value to string
                        ))}
                    </Input>
                </FormGroup>
                {this.props.selectedCountryId && (
                    <FormGroup>
                        <Label>District</Label>
                        <Input
                            type="select"
                            value={this.props.selectedDistrictId || ""}
                            onChange={(e) => onChange("selectedDistrictId", e.target.value)}
                        >
                            <option value="">Select District</option>
                            {this.props.districts?.map(d => (
                                <option key={d.id} value={String(d.id)}>{d.name}</option>
                            ))}
                        </Input>
                    </FormGroup>
                )}
                {this.props.selectedDistrictId && (
                    <FormGroup>
                        <Label>City</Label>

                        {this.props.cities?.length === 0 && (
                            <p className="text-muted small">Select a district first</p>
                        )}

                        {this.props.cities?.map((city) => (
                            <FormGroup check key={city.id}>
                                <Label check>
                                    <Input
                                        type="checkbox"
                                        value={String(city.id)}
                                        checked={this.props.selectedCityIds?.includes(String(city.id))}
                                        onChange={(e) => {
                                            const cityId = e.target.value;
                                            const checked = e.target.checked;

                                            let updatedCities = [...this.props.selectedCityIds];

                                            if (checked) {
                                                updatedCities.push(cityId);
                                            } else {
                                                updatedCities = updatedCities.filter(id => id !== cityId);
                                            }

                                            this.props.onChange("selectedCityIds", updatedCities);
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
