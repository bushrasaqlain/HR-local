"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import AllApplicants from "./allApplicants.jsx";
import CompanyProfile from "./companyProfile.jsx";
import ChangePasswordForm from "../form/changepassword/changepasswordform.jsx"

import ChatBox from "./messages/chatBox.jsx";
import JobListings from "./jobList.jsx";
import PackagesList from "./packagesList.jsx";
import PostJob from "./postJob.jsx";
import Pricing from "./pricing.jsx";
import WidgetContentBox from "./shortlisted-resumes/WidgetContentBox.jsx";
const CompanyDashboardArea = ({ activeTab }) => {
    const router = useRouter();
    const [userInfo, setUserInfo] = useState({ userId: null, token: null });

    useEffect(() => {
        if (typeof window !== "undefined") {
            const userId = sessionStorage.getItem("userId");
            const token = sessionStorage.getItem("token");
            if (!token) {
                router.replace("/login");
                return;
            }

            setUserInfo({ userId, token });
        }
    }, [router]);


    const [hasActivePackage, setHasActivePackage] = useState(false);
    // useEffect(() => {
    //     const fetchUserPackageStatus = async () => {
    //         try {
    //             if (!userId) {
    //                 console.error('User ID is undefined.');
    //                 return;
    //             }

    //             const response = await fetch(`http://localhost:8080/checkUserPackageStatus/${userId}`);
    //             if (!response.ok) {
    //                 console.error(`Error: ${response.status} - ${response.statusText}`);
    //                 return;
    //             }

    //             const data = await response.json();
    //             console.log('API Response:', data);

    //             // Assuming 'data.packageStatus' is the correct property
    //             setHasActivePackage(data.packageStatus === "active");
    //         } catch (error) {
    //             console.error('Error checking user package status:', error);
    //         }
    //     };

    //     // Check if userId is available before making the API call
    //     if (userId) {
    //         fetchUserPackageStatus();
    //     }
    // }, [userId]);


    if (!userInfo.userId) return <div>Loading dashboard…</div>;

    const renderContent = () => {
        switch (activeTab) {
            case "companyProfile":
                return <CompanyProfile userId={userInfo.userId} />;
            case "allApplicants":
                return <AllApplicants />
            case "jobList":
                return <JobListings userId={userInfo.userId} />;

            // case "packagesList":
            //     return <PackagesList />;

            // case "chatBox":
            //     return <ChatBox />;

            // case "postJob":
            //     return hasActivePackage ? (
            //         <PostJob userId={userId} />
            //     ) : (
            //         <h6 className="text-danger">
            //             Subscribe to a package before posting the job. Click on{" "}
            //             <Link
            //                 href={`/employers-dashboard/pricing/${userId}`}
            //                 className="proceed-btn"
            //             >
            //                 <u>Job Packages</u>
            //             </Link>
            //             {" "}to subscribe.
            //         </h6>
            //     );

            // case "WidgetContentBox":
            //     return <WidgetContentBox />
            // case "changepassword":
            //     return <ChangePasswordForm />;
            default:
                return <CompanyProfile />
        }
    };


    return (
        <section className="user-dashboard py-2 my-4">
            <div className="container">
                <div className="profile__tab-content p-3">{renderContent()}</div>
            </div>
        </section>
    );
};

export default CompanyDashboardArea;
