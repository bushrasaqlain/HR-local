import React, { Component } from "react";

class Cardstyling extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hovered: false,
    };
  }

  handleMouseEnter = () => {
    this.setState({ hovered: true });
  };

  handleMouseLeave = () => {
    this.setState({ hovered: false });
  };

  render() {
    const { children, className = "col-12 col-md-4" } = this.props;
    const { hovered } = this.state;

    const styles = {
      transition: "transform 0.3s",
      // transform: hovered ? "scale(1.05)" : "scale(1)",
      // boxShadow: hovered ? "0 0.5rem 1rem rgba(0,0,0,0.15)" : "none",
      cursor: "pointer",
    };

    return (
      <div
        className={className}
        style={styles}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        {children}
      </div>
    );
  }
}

export default Cardstyling;
