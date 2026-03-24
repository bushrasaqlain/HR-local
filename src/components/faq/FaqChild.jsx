import { FaQuestionCircle } from "react-icons/fa";

const faqData = {
  account: [
    {
      q: "How do I register on the platform?",
      a: "You can register by selecting your role (Employer or Candidate) and filling out the registration form."
    },
    {
      q: "Why can’t I log in after registration?",
      a: "Your account must be approved by the Registration Admin before you can log in."
    },
    {
      q: "Can I update my profile?",
      a: "Yes, you can update your profile details anytime from your dashboard."
    }
  ],

  employer: [
    {
      q: "How can I post a job?",
      a: "Employers can post jobs after purchasing a package. Jobs require admin approval before publishing."
    },
    {
      q: "Why is my job not visible?",
      a: "Jobs become visible only after approval by the Registration Admin."
    },
    {
      q: "How can I shortlist candidates?",
      a: "You can view candidate profiles and shortlist them directly from your dashboard."
    }
  ],

  candidate: [
    {
      q: "How can I apply for jobs?",
      a: "Browse available jobs and click on Apply for the desired position."
    },
    {
      q: "How do I know if I am shortlisted?",
      a: "Shortlisted status and interview details will be shown in your dashboard."
    },
    {
      q: "Can I apply for multiple jobs?",
      a: "Yes, candidates can apply to multiple jobs."
    }
  ],

  admin: [
    {
      q: "What does the Registration Admin do?",
      a: "The Registration Admin approves users and job postings to maintain system quality."
    },
    {
      q: "What is the role of Database Admin?",
      a: "Database Admin manages system data like packages, cities, and configurations."
    }
  ],

  payment: [
    {
      q: "Why is my payment not successful?",
      a: "Payment issues may occur due to invalid details or network issues. Please try again."
    },
    {
      q: "Do I need a package for each job?",
      a: "Yes, employers must purchase a package before posting a job."
    },
    {
      q: "Can I get a refund?",
      a: "Refunds depend on company policy. Please contact support."
    }
  ]
};

const FaqChild = ({ category }) => {
  const data = faqData[category] || [];

  return (
    <div className="accordion custom-accordion mb-4">

      {data.map((item, index) => (
        <div className="accordion-item" key={index}>
          <h2 className="accordion-header">
            <button
              className={`accordion-button ${index !== 0 ? "collapsed" : ""}`}
              type="button"
              data-bs-toggle="collapse"
              data-bs-target={`#${category}-${index}`}
            >
              <FaQuestionCircle className="me-2 icon" />
              {item.q}
            </button>
          </h2>

          <div
            id={`${category}-${index}`}
            className={`accordion-collapse collapse ${index === 0 ? "show" : ""}`}
          >
            <div className="accordion-body">
              {item.a}
            </div>
          </div>
        </div>
      ))}

    </div>
  );
};

export default FaqChild;