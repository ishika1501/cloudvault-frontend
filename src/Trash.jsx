import { useEffect, useState } from "react";
import "./css/Trash.css";

const Trash = () => {
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [restoringFileId, setRestoringFileId] = useState(null);

  const fetchTrash = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/v1/files/trash", {
        method: "GET",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Trash");
      }

      const data = await response.json();
      setDeletedFiles(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const restoreFile = async (fileId) => {
    try {
      setRestoringFileId(fileId);
      setError("");
      setSuccess("");

      const response = await fetch(
          `/api/v1/files/${fileId}/restore`,
          {
            method: "PUT",
            credentials: "include"
          }
      );

      if (!response.ok) {
        throw new Error("Failed to restore file");
      }

      setDeletedFiles((prevFiles) =>
          prevFiles.filter((file) => file.fileId !== fileId)
      );

      setSuccess("File restored successfully");
    } catch (err) {
      setError(err.message || "Unable to restore file");
    } finally {
      setRestoringFileId(null);
    }
  };

  if (loading) {
    return <div className="trash-message">Loading Trash...</div>;
  }

  return (
      <div className="trash-container">

        <div className="trash-header">
          <div>
            <h2>Trash</h2>
            <p>Manage your deleted files. Restore files whenever you need them.</p>
          </div>

          <span className="trash-count">
          {deletedFiles.length} items
        </span>
        </div>

        {error && (
            <div className="alert-message error-message">
              {error}
            </div>
        )}

        {success && (
            <div className="alert-message success-message">
              {success}
            </div>
        )}

        {deletedFiles.length === 0 ? (
            <div className="trash-empty">
              <span style={{ fontSize: "40px" }}>🗑️</span>
              <h3>Trash is empty</h3>
              <p>Files you delete will appear here.</p>
            </div>
        ) : (
            <div className="trash-grid">
              {deletedFiles.map((file) => (
                  <div className="trash-card" key={file.fileId}>

                    <div className="trash-file-icon">📄</div>

                    <div className="trash-file-details">
                      <h4 title={file.fileName}>
                        {file.fileName}
                      </h4>

                      <p>
                        Deleted on:{" "}
                        {file.deletedAt
                            ? new Date(file.deletedAt).toLocaleDateString()
                            : "Unknown"}
                      </p>
                    </div>

                    <button
                        className="restore-button"
                        disabled={restoringFileId === file.fileId}
                        onClick={() => restoreFile(file.fileId)}
                    >
                      {restoringFileId === file.fileId
                          ? "Restoring..."
                          : "↩ Restore"}
                    </button>

                  </div>
              ))}
            </div>
        )}

      </div>
  );
};

export default Trash;