import React, { Component } from "react";
import SearchForm3 from "./SearchForm3"; // Optional if you want custom form
import PopularSearch from "./PopularSearch";
import Image from "next/image";
import Link from "next/link";

class Hero extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchQuery: "",
    };
  }

  handleChange = (e) => {
    this.setState({ searchQuery: e.target.value });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    // You can redirect or handle search logic here
    console.log("Searching for:", this.state.searchQuery);
  };

  render() {
    const { searchQuery } = this.state;

    return (
      <section className="position-relative w-100" style={{ height: "100vh" }}>
        {/* Background Image */}
        <div className="position-absolute w-100 h-100">
          <Image
            src="/images/background/new.jpg"
            alt="Hero Background"
            layout="fill"
            objectFit="cover"
            quality={100}
          />
          {/* Overlay */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(5px)",
              WebkitBackdropFilter: "blur(5px)",
            }}
          ></div>
        </div>

        {/* Hero Content */}
        <div
          className="container position-relative h-100 d-flex align-items-center"
          style={{ zIndex: 2 }}
        >
          <div className="row">
            <div className="col-lg-6 col-md-8 col-sm-12">
              <h1 className="fw-bold text-white mb-3">
                FIND TOP TALENT READY TO MAKE AN IMPACT
              </h1>
              <p className="mb-4 text-white">
                Are you struggling with lengthy hiring processes and unqualified
                candidates? Superio connects you directly with high-quality,
                motivated, job-ready talent prepared to contribute from day one.
              </p>
             <Link href="/login">
  <button
    type="button"
    className="btn-lg rounded-pill ms-2 custom-btn"
  >
    Register
  </button>
</Link>
              <style jsx>{`
                .custom-btn {
                  border: 2px solid #000;
                  background-color: #000;
                  color: #fff;
                  padding: 10px 30px;
                  font-size: 16px;
                  transition: all 0.3s ease;
                }
              `}</style>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default Hero;
