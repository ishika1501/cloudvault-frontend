import { useEffect, useState } from "react";

const CloudFileList = ({ files = [], onFileDeleted }) => {

  const [contextMenu, setContextMenu] = useState(null);
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [error, setError] = useState("");

  const handleContextMenu = (event, file) => {
    event.preventDefault();

    setContextMenu({
      file,
      x: Math.min(event.clientX, window.innerWidth - 220),
      y: Math.min(event.clientY, window.innerHeight - 100)
    });
  };

  // Close context menu on outside click or Escape
  useEffect(() => {
    const closeMenu = () => setContextMenu(null);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("click", closeMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", closeMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleDeleteFile = async () => {
    const file = contextMenu?.file;

    if (!file) return;

    try {
      setDeletingFileId(file.fileId);
      setError("");
      setContextMenu(null);

      const response = await fetch(
          `/api/v1/files/${file.fileId}`,
          {
            method: "DELETE",
            credentials: "include"
          }
      );

      if (!response.ok) {
        throw new Error("Failed to move file to Trash");
      }

      onFileDeleted(file.fileId);

    } catch (err) {
      setError(err.message || "Unable to delete file");
    } finally {
      setDeletingFileId(null);
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split(".").pop().toLowerCase();

    const icons = {
      pdf: "📕",
      doc: "📘",
      docx: "📘",
      xls: "📗",
      xlsx: "📗",
      ppt: "📙",
      pptx: "📙",
      jpg: "🖼️",
      jpeg: "🖼️",
      png: "🖼️",
      zip: "📦",
      rar: "📦",
      mp4: "🎬",
      mp3: "🎵"
    };

    return icons[extension] || "📄";
  };

  return (
      <>
        {error && (
            <div className="alert-message error-message">
              {error}
            </div>
        )}

        {files.map((file) => (
            <div
                className="file-card"
                key={file.fileId}
                onContextMenu={(event) =>
                    handleContextMenu(event, file)
                }
            >
              <div className="file-preview">
                <span>{getFileIcon(file.fileName)}</span>
              </div>

              <div className="file-info">
                <strong title={file.fileName}>
                  {file.fileName}
                </strong>

                <small>
                  {deletingFileId === file.fileId
                      ? "Deleting..."
                      : "File"}
                </small>
              </div>
            </div>
        ))}

        {contextMenu && (
            <div
                className="file-context-menu"
                style={{
                  left: contextMenu.x,
                  top: contextMenu.y
                }}
                onClick={(event) => event.stopPropagation()}
            >
              <div className="context-menu-header">
                {contextMenu.file.fileName}
              </div>

              <button
                  type="button"
                  className="context-menu-item delete-action"
                  onClick={handleDeleteFile}
              >
                <span>🗑️</span>
                Move to Trash
              </button>
            </div>
        )}
      </>
  );
};

export default CloudFileList;