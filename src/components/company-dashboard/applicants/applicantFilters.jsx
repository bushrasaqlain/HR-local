import React from "react";
import { FormGroup, Input } from "reactstrap";

class ApplicantFilters extends React.Component {
  state = {
    showAllSkills: false,
    selectedAvailability: { day: "", shift: "" },
  };

  render() {
    const {
      counts,
      selectedTabIndex,
      onChange,
    } = this.props;

    return (
<>
 {/* Status */}
        <FormGroup>
          <label>Status</label>
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
</>
    )
       
  }
}

export default ApplicantFilters;