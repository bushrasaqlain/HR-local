import React, { useEffect, useState } from "react";
import api from "../../../lib/api";

const BoostRequests = () => {
    const [orders, setOrders] = useState([]);

    const fetchOrders = async () => {
        const res = await api.get("/candidateProfile/boost/orders");
        setOrders(res.data.data || []);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleApprove = async (id) => {
        await api.put(`/candidateProfile/boost/activate/${id}`);
        fetchOrders();
    };

    const handleReject = async (id) => {
        await api.put(`/candidateProfile/boost/reject/${id}`);
        fetchOrders();
    };

    return (
        <div className="container mt-4">
            <h4>Boost Requests</h4>

            <table className="table">
                <thead>
                    <tr>
                        <th>Candidate</th>
                        <th>Email</th>
                        <th>Package</th>
                        <th>Price</th>
                        <th>Duration</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((o) => (
                        <tr key={o.id}>
                            <td>{o.candidate_name}</td>
                            <td>{o.candidate_email}</td>
                            <td>{o.package_name}</td>
                            <td>{o.currency} {o.price}</td>
                            <td>{o.boost_duration_days} days</td>
                            <td>
                                <button onClick={() => handleApprove(o.id)} className="btn btn-success btn-sm me-2">
                                    Approve
                                </button>
                                <button onClick={() => handleReject(o.id)} className="btn btn-danger btn-sm">
                                    Reject
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BoostRequests;