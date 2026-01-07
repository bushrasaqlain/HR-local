import React, { useState, useEffect } from 'react';

const PackagesList = () => {
  const [packageData, setPackageData] = useState([]);
  const [loading, setLoading] = useState(true);
 const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const userId = sessionStorage.getItem("userId");

  useEffect(() => {
    const fetchPackageData = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}packages/getPackageDetail/${userId}`);
        const data = await response.json();
        setPackageData(data);
      } catch (error) {
        console.error('Error fetching package data:', error);
      } finally {
        setLoading(false); // Set loading to false regardless of success or error
      }
    };

    fetchPackageData();
  }, [userId]);

  // Render based on loading state
  if (loading) {
    return <p>Loading...</p>;
  }

 
  return (
       
    <table className="default-table manage-job-table">
      <thead>
        <tr>
          <th>Job id</th>
          <th>Package</th>
          <th>Expiry</th>
          <th>Total Jobs/CVs</th>
          <th>Used</th>
          <th>Remaining</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
      {packageData.map((item, index) => (
          <tr key={item.order_id}>
            <td>{index + 1}</td>
            <td className="trans-id">{item.order_id}</td>
            <td > {item.package_type}</td>
            <td className="expiry">
  {item.Expire_At ? (
    <>
      {new Date(item.Expire_At).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      })}{' '}
      {new Date(item.Expire_At).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })}
    </>
  ) : (
    ""
  )}
</td>
            <td className="total-jobs">{item.Jobs}</td>
            <td className="used">{item.total_jobs}</td>
            <td className="remaining">{item.remaining_jobs}</td>
            <td className="status">{item.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PackagesList;
