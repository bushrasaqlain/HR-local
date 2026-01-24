"use client";
import Link from "next/link";
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
import Profile from "./dashboard/profile.jsx";
const CompanyDashboardArea = ({ activeTab }) => {
    const router = useRouter();
    const [userInfo, setUserInfo] = useState({ userId: null, token: null });
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
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
    useEffect(() => {
        const fetchUserPackageStatus = async () => {
            try {
                if (!userInfo.userId) {
                    console.error('User ID is undefined.');
                    return;
                }

                const response = await fetch(`${apiBaseUrl}packages/checkCompanyPackageStatus/${userInfo.userId}`);
                if (!response.ok) {
                    console.error(`Error: ${response.status} - ${response.statusText}`);
                    return;
                }

                const data = await response.json();
                console.log('API Response:', data);

                // Assuming 'data.packageStatus' is the correct property
                setHasActivePackage(data.packageStatus === "active");
            } catch (error) {
                console.error('Error checking user package status:', error);
            }
        };

        // Check if userId is available before making the API call
        if (userInfo.userId) {
           // fetchUserPackageStatus();
        }
    }, [userInfo.userId]);


    if (!userInfo.userId) return <div>Loading dashboard…</div>;

    const renderContent = () => {
        switch (activeTab) {
            case "profile":
                return <Profile />

            case "postJob":
                return <PostJob />
            case "companyProfile":
                return <CompanyProfile />;

            case "allApplicants":
                return <AllApplicants />
            case "jobList":
                return <JobListings />;

            case "packagesList":
                return <PackagesList />;

            case "chatBox":
                return <ChatBox />;

            case "changepassword":
                return <ChangePasswordForm />

            default:
                return <Profile />
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
