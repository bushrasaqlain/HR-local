import React, { Component } from "react";

class Block2 extends Component {
  render() {
    const blockContent = [
      {
        id: 1,
        icon: (
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" stroke="#36565f" strokeWidth="1.5" />
            <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" stroke="#36565f" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M19 4v4M17 6h4" stroke="#36565f" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
        title: (
          <>
            Register an account <br />
            to start
          </>
        ),
      },
      {
        id: 2,
        icon: (
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="6" stroke="#36565f" strokeWidth="1.5" />
            <path d="M14.5 14.5L20 20" stroke="#36565f" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M7 10h6M10 7v6" stroke="#36565f" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        ),
        title: (
          <>
            Explore over thousands <br />
            of resumes
          </>
        ),
      },
      {
        id: 3,
        icon: (
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="5" width="16" height="14" rx="2" stroke="#36565f" strokeWidth="1.5" />
            <path d="M8 10l2.5 2.5L16 7" stroke="#36565f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ),
        title: (
          <>
            Find the most suitable <br />
            candidate
          </>
        ),
      },
    ];

    return (
      <div className="container py-5">
        <div className="row text-center">
          {blockContent.map((item) => (
            <div className="col-lg-4 col-md-4 col-sm-12" key={item.id}>
              <div className="p-2 h-50 rounded">
                <div className="mb-3 flip-wrapper d-flex justify-content-center">
                  {item.icon}
                </div>

                <h4 className="fw-semibold">{item.title}</h4>
              </div>
              <style jsx>{`
                .flip-wrapper {
                  perspective: 1000px;
                }

                .flip-icon {
                  transition: transform 0.6s;
                  transform-style: preserve-3d;
                }

                .process-block:hover .flip-icon {
                  transform: rotateY(180deg);
                }
              `}</style>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default Block2;