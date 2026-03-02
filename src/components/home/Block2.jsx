import React, { Component } from "react";
import Image from "next/image";

class Block2 extends Component {
  render() {
    const blockContent = [
      {
        id: 1,
        icon: "/images/resource/process-1.png",
        title: (
          <>
            Register an account <br />
            to start
          </>
        ),
      },
      {
        id: 2,
        icon: "/images/resource/process-2.png",
        title: (
          <>
            Explore over thousands <br />
            of resumes
          </>
        ),
      },
      {
        id: 3,
        icon: "/images/resource/process-3.png",
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
            <div className="col-lg-4 col-md-4 col-sm-12 mb-4" key={item.id}>
              <div className="p-4 h-100  rounded">
                <div className="mb-3 flip-wrapper">
                  <Image
                    width={50}
                    height={61}
                    src={item.icon}
                    alt="how it works"
                  />
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
