import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Allowed file types check
function checkFileTypes(files) {
    const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    return files.every(file => allowedTypes.includes(file.type));
}

const CvUploader = ({ userId }) => {
    const [getManager, setManager] = useState([]);
    const [getError, setError] = useState("");
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);


    // Handle file selection
    const cvManagerHandler = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        if (checkFileTypes(files)) {
            setManager([files[0]]); // always keep only the latest file
            setError("");
        } else {
            setError("Only accept (.doc, .docx, .pdf) file");
        }
    };



    // Delete selected file
    const deleteHandler = (name) => {
        const deleted = getManager.filter((file) => file.name !== name);
        setManager(deleted);
    };

    // Handle form submit
    const handleUpload = async (e) => {
        e.preventDefault();

        if (getManager.length === 0) {
            setError("Please select a file to upload.");
            return;
        }

        const file = getManager[0];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("userId", userId);

        try {
            const response = await axios.post("http://localhost:8080/resume", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setError("");
            if (response.status == 200) {
                if (response.data.msg == "File already uploaded previously") {
                    toast.error(response.data.msg);
                } else {
                    toast.success("Resume Submitted Successfully");
                }

            }

            // Clean up after submit
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }

            setManager([]);
            fileInputRef.current.value = "";
        } catch (error) {
            console.error("Error uploading file:", error);
            setError("Error uploading file. Please try again.");
        }
    };

    return (
        <>
            <div className="text-danger text-center mb-2">Upload only .doc, .docx, .pdf format</div>

            {/* Show selected file name */}
            {getManager.length > 0 && (
                <div className="file-preview">
                    {getManager.map((file, index) => (
                        <p className="text-center" key={index}>
                            <strong>Selected File:</strong>
                            <span
                                className="text-primary text-bold me-3"
                                style={{ cursor: "pointer", textDecoration: "underline" }}
                                onClick={() => {
                                    const fileURL = URL.createObjectURL(file);
                                    setPreviewUrl(fileURL);       // keep track of it
                                    window.open(fileURL, "_blank");
                                }}

                            >
                                {file.name}
                            </span>
                            <span className="edit-btns">
                                <button onClick={() => deleteHandler(file.name)}>
                                    <span className="la la-close"></span>
                                </button>
                            </span>
                        </p>
                    ))}
                </div>
            )}
            {/* Upload Section */}
            <div className="uploading-resume">

                <div className="uploadButton">
                    <label className="cv-uploadButton position-relative">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".doc,.docx,application/msword,application/pdf"
                            id="upload"
                            onChange={cvManagerHandler}
                            className="form-control position-absolute top-0 start-0 w-100 h-100 opacity-0"
                        />
                        <div className="text-center py-3">
                            <strong>Click here or drop file to upload</strong>
                            <div className="text-muted small">
                                Max 5Mb | Allowed: (.doc, .docx, .pdf)
                            </div>
                        </div>
                    </label>

                    {/* Show error message */}
                    {getError && <p className="ui-danger mb-0">{getError}</p>}



                    {/* Submit Button */}
                    <button
                        type="button"
                        className="theme-btn btn-style-one my-4"
                        onClick={handleUpload}

                    >
                        Submit Resume
                    </button>
                </div>
            </div>
        </>
    );
};

export default CvUploader;
