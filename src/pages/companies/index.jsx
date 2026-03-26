"use client";

import { useEffect, useState } from "react";

const CompaniesPage = () => {
    const [companies, setCompanies] = useState([]);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    useEffect(() => {
        fetch(`${apiBaseUrl}company-info/all-companies`)
            .then((res) => res.json())
            .then((data) => setCompanies(data))
            .catch((err) => console.error(err));
    }, []);

    return (
        <div className="container py-5" style={{ marginTop: "100px", marginBottom: "100px" }}>
            <h2 className="text-center mb-4">All Companies</h2>

            <div className="row justify-content-center">
                {companies.map((company) => (
                    <div
                        className="col-lg-2 col-md-3 col-sm-4 col-6 mb-4 text-center"
                        key={company.id}
                    >
                        {company.logo ? (
                            <img
                                src={`data:image/png;base64,${company.logo}`}
                                alt={company.company_name}
                                className="company-logo-clean"
                            />
                        ) : (
                            <div>No Logo</div>
                        )}

                        <h6 className="mt-2">{company.company_name}</h6>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CompaniesPage;