import React, { Component } from "react";
import { Card, CardBody, CardHeader, Input } from "reactstrap";

class JobList extends Component {
  state = {
    selected: "",
  };

  data = {
    skills: ["React", "Node.js", "Django"],
    jobs: ["Frontend Developer", "Backend Developer", "Full Stack Dev"],
    locations: ["Karachi", "Lahore", "Islamabad"],
  };

  handleChange = (e) => {
    this.setState({ selected: e.target.value });
  };

  render() {
    const { selected } = this.state;

    return (
      <Card>
        <CardHeader>Select Category</CardHeader>
        <CardBody>
          <Input type="select" value={selected} onChange={this.handleChange}>
            <option value="">Select</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="appeared">Appeared in Search</option>
            <option value="hold">On Hold</option>
          </Input>

          {selected && (
            <ul className="mt-3 mb-0">
              {this.data[selected].map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          )}

          {!selected && (
            <p className="text-muted mt-3 mb-0">
              Please select an option to see the list
            </p>
          )}
        </CardBody>
      </Card>
    );
  }
}

export default JobList;
