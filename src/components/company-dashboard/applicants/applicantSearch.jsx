import React from "react";
import { Input, Button } from "reactstrap";

class ApplicantSearch extends React.Component {
  render() {
    return (
      <div className="d-flex gap-2 mb-4">
        <Input placeholder="Search by name, email..." />
        <Button color="primary">Search</Button>
      </div>
    );
  }
}

export default ApplicantSearch;
