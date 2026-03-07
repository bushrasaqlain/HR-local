import React from "react";
import { Input, Button } from "reactstrap";

class ApplicantSearch extends React.Component {
  state = {
    query: "",
  };

handleSearch = () => {
  this.props.onSearch({ query: this.state.query });
};

  render() {
    const { query } = this.state;

    // return (
    //   // <div className="mb-4 border rounded p-3 bg-white d-flex gap-2">
    //   //   <Input
    //   //     placeholder="Search by name, email, age, gender, marital status, education..."
    //   //     value={query}
    //   //     onChange={(e) => this.setState({ query: e.target.value })}
    //   //     onKeyDown={(e) => e.key === "Enter" && this.handleSearch()}
    //   //   />
    //   //   <Button color="primary" onClick={this.handleSearch}>
    //   //     Search
    //   //   </Button>
    //   // </div>
    // );
  }
}

export default ApplicantSearch;