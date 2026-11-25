
import { useEffect, useState } from "react";
import "./Dashboard.css";
import { apiRequest } from "./services/api";

function getFileIcon(fileName = "") {
  const extension = fileName.split(".").pop().toLowerCase();

  const icons = {
    pdf: "📕",
    doc: "📘",
    docx: "📘",
    txt: "📄",
    csv: "📊",
    xls: "📊",
    xlsx: "📊",
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    gif: "🖼️",
    mp4: "🎬",
    zip: "📦",
    rar: "📦",
    java: "☕",
    js: "📜",
    jsx: "📜",
    json: "📋"
  };

  return icons[extension] || "📄";
}

function Dashboard() {
  const [rootId, setRootId] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState("");
  const [currentFolderName, setCurrentFolderName] = useState("home");

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [starredFiles, setStarredFiles] = useState([]);

  const [activeView, setActiveView] = useState("files");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [folderName, setFolderName] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Load folders and files inside a folder
  async function loadContents(id) {
    const data = await apiRequest(`/folders/${id}/contents`);

    setFolders(data.folders || []);
    setFiles(data.files || []);
  }

  // Load recent activity
  async function loadRecent() {
    const response = await apiRequest("/recent", {
      method: "GET",
      cache: "no-store"
    });

    console.log("RAW RECENT RESPONSE:", response);
    console.log("IS ARRAY:", Array.isArray(response));

    if (Array.isArray(response)) {
      console.log("FIRST ITEM:", response[0]);
      console.log("FIRST ITEM KEYS:", Object.keys(response[0] || {}));
    }

    let items = [];

    if (Array.isArray(response)) {
      items = response;
    } else if (Array.isArray(response?.data)) {
      items = response.data;
    } else if (Array.isArray(response?.items)) {
      items = response.items;
    } else if (Array.isArray(response?.data?.items)) {
      items = response.data.items;
    } else if (Array.isArray(response?.content)) {
      items = response.content;
    }

    console.log("EXTRACTED ITEMS:", items);

    setRecentItems(items);
    return items;
  }

  // Load starred files
  async function loadStarred() {
    const response = await apiRequest("/api/v1/files/starred", {
      method: "GET",
      cache: "no-store"
    });

    const items = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
            ? response.data
            : [];

    setStarredFiles(items);
    return items;
  }

  // Initialize dashboard
  useEffect(() => {
    async function initializeDashboard() {
      try {
        const root = await apiRequest("/folders/root");

        setRootId(root.folderId);
        setCurrentFolderId(root.folderId);
        setCurrentFolderName(root.folderName);

        await loadContents(root.folderId);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initializeDashboard();
  }, []);

  // Open a folder
  async function openFolder(folder) {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await loadContents(folder.folderId);

      setCurrentFolderId(folder.folderId);
      setCurrentFolderName(folder.folderName);
      setActiveView("files");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Go back to home folder
  async function goToRoot() {
    if (!rootId) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await loadContents(rootId);

      setCurrentFolderId(rootId);
      setCurrentFolderName("home");
      setActiveView("files");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Create folder
  async function createFolder(e) {
    e.preventDefault();

    if (!folderName.trim() || !currentFolderId) return;

    try {
      setError("");
      setSuccess("");

      await apiRequest("/folders", {
        method: "POST",
        body: JSON.stringify({
          folderName: folderName.trim(),
          parentId: currentFolderId
        })
      });

      setFolderName("");
      setShowForm(false);

      await loadContents(currentFolderId);
      setSuccess("Folder created successfully.");
    } catch (err) {
      setError(err.message);
    }
  }

  // Upload file
  async function uploadFile(e) {
    const file = e.target.files[0];

    if (!file || !currentFolderId) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderId", currentFolderId);

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      await apiRequest("/api/v1/files/upload", {
        method: "POST",
        body: formData
      });

      await loadContents(currentFolderId);

      setActiveView("files");
      setSuccess("File uploaded successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  // Download/open file
  async function downloadFile(fileId) {
    if (!fileId) {
      setError("File ID is missing.");
      return;
    }

    const downloadTab = window.open("about:blank", "_blank");

    try {
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Session expired. Please login again.");
      }

      const response = await fetch(
          `/api/v1/files/${fileId}/download`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to download file.");
      }

      const responseText = await response.text();

      let downloadUrl = responseText;

      try {
        downloadUrl = JSON.parse(responseText);
      } catch {
        // Response was already a plain text URL
      }

      if (
          typeof downloadUrl !== "string" ||
          !downloadUrl.startsWith("https://")
      ) {
        throw new Error("Invalid download URL received from server.");
      }

      if (downloadTab) {
        downloadTab.location.href = downloadUrl;
      } else {
        window.location.href = downloadUrl;
      }

      // Refresh Recent after opening the file
      if (activeView === "recent") {
        await loadRecent();
      }
    } catch (err) {
      if (downloadTab) {
        downloadTab.close();
      }

      setError(err.message);
    }
  }

  // Open Recent page
  async function openRecent() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await loadRecent();

      setActiveView("recent");
    } catch (err) {
      setError(err.message);
      setRecentItems([]);
    } finally {
      setLoading(false);
    }
  }

  // Open Starred page
  async function openStarred() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await loadStarred();

      setActiveView("starred");
    } catch (err) {
      setError(err.message);
      setStarredFiles([]);
    } finally {
      setLoading(false);
    }
  }

  // Star or unstar a file
  async function toggleStar(file) {
    const fileId = file.fileId || file.id;

    if (!fileId) {
      setError("File ID is missing.");
      return;
    }

    try {
      setError("");
      setSuccess("");

      if (file.isStarred) {
        await apiRequest(`/api/v1/files/${fileId}/star`, {
          method: "DELETE"
        });
      } else {
        await apiRequest(`/api/v1/files/${fileId}/star`, {
          method: "PUT"
        });
      }

      // Refresh current folder and starred list
      if (currentFolderId) {
        await loadContents(currentFolderId);
      }

      await loadStarred();

      // Refresh current view if it is Recent
      if (activeView === "recent") {
        await loadRecent();
      }

      setSuccess(
          file.isStarred
              ? "File removed from Starred."
              : "File added to Starred."
      );
    } catch (err) {
      setError(err.message);
    }
  }

  // Open an item from Recent
  async function openRecentItem(item) {
    if (item.itemType === "FOLDER") {
      await openFolder({
        folderId: item.itemId,
        folderName: item.itemName
      });
    } else if (item.itemType === "FILE") {
      await downloadFile(item.itemId);
    }
  }

  return (
      <div className="dashboard">

        {/* Sidebar */}
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-icon">☁</div>
            <span>
            Cloud<span className="brand-highlight">Vault</span>
          </span>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-label">WORKSPACE</p>

            <nav className="sidebar-nav">
              <button
                  className={`nav-item ${activeView === "files" ? "active" : ""}`}
                  onClick={goToRoot}
              >
                <span className="nav-icon">▦</span>
                <span>My Files</span>
              </button>

              <button
                  className={`nav-item ${activeView === "recent" ? "active" : ""}`}
                  type="button"
                  onClick={openRecent}
              >
                <span className="nav-icon">◷</span>
                <span>Recent</span>
              </button>

              <button
                  className={`nav-item ${activeView === "starred" ? "active" : ""}`}
                  type="button"
                  onClick={openStarred}
              >
                <span className="nav-icon">☆</span>
                <span>Starred</span>
              </button>

              <button className="nav-item" type="button">
                <span className="nav-icon">▤</span>
                <span>Trash</span>
              </button>
            </nav>
          </div>

          <div className="sidebar-bottom">
            <div className="storage-card">
              <div className="storage-heading">
                <span>Storage</span>
                <span className="storage-icon">☁</span>
              </div>

              <p className="storage-description">
                Your files, all in one place.
              </p>

              <div className="storage-track">
                <div className="storage-fill"></div>
              </div>

              <small>Storage overview coming soon</small>
            </div>

            <button className="nav-item settings-item" type="button">
              <span className="nav-icon">⚙</span>
              <span>Settings</span>
            </button>
          </div>
        </aside>

        {/* Main area */}
        <main className="main-content">

          <header className="topbar">
            <div className="search-box">
              <span className="search-icon">⌕</span>
              <input type="search" placeholder="Search your files..." />
              <span className="search-shortcut">⌘ K</span>
            </div>

            <div className="profile-area">
              <span className="profile-avatar">U</span>
              <div className="profile-details">
                <strong>My Account</strong>
                <small>Personal workspace</small>
              </div>
            </div>
          </header>

          <section className="dashboard-content">

            <div className="welcome-section">
              <div>
                <p className="eyebrow">YOUR WORKSPACE</p>

                <h1>
                  {activeView === "recent"
                      ? "Recent"
                      : activeView === "starred"
                          ? "Starred"
                          : currentFolderName}
                </h1>

                <p className="welcome-description">
                  {activeView === "recent"
                      ? "Access your recently opened files and folders."
                      : activeView === "starred"
                          ? "Quickly access your important files."
                          : "Manage your files and folders in one place."}
                </p>
              </div>

              {activeView === "files" && (
                  <div className="header-actions">
                    <button
                        className="secondary-button"
                        onClick={() => {
                          setShowForm(!showForm);
                          setError("");
                        }}
                    >
                      <span>＋</span> New Folder
                    </button>

                    <label className={`primary-button ${uploading ? "disabled" : ""}`}>
                      <span>↑</span>
                      {uploading ? "Uploading..." : "Upload File"}

                      <input
                          type="file"
                          hidden
                          disabled={uploading}
                          onChange={uploadFile}
                      />
                    </label>
                  </div>
              )}
            </div>

            {activeView === "files" && (
                <div className="breadcrumb">
                  <button onClick={goToRoot}>My Files</button>
                  <span className="breadcrumb-separator">/</span>
                  <strong>{currentFolderName}</strong>
                </div>
            )}

            {error && (
                <div className="alert-message error-message">
                  <span>!</span>
                  {error}
                </div>
            )}

            {success && (
                <div className="alert-message success-message">
                  <span>✓</span>
                  {success}
                </div>
            )}

            {activeView === "files" && showForm && (
                <form className="folder-form" onSubmit={createFolder}>
                  <div className="folder-form-info">
                    <span className="form-folder-icon">📁</span>
                    <div>
                      <strong>Create a new folder</strong>
                      <small>Give your folder a name to get started.</small>
                    </div>
                  </div>

                  <input
                      type="text"
                      placeholder="Enter folder name"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      autoFocus
                      required
                  />

                  <button className="primary-button" type="submit">
                    Create Folder
                  </button>

                  <button
                      className="cancel-button"
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setFolderName("");
                      }}
                  >
                    Cancel
                  </button>
                </form>
            )}

            {loading ? (
                <div className="loading-state">
                  <div className="loader"></div>
                  <p>Loading your files...</p>
                </div>
            ) : (
                <>
                  {/* My Files view */}
                  {activeView === "files" && (
                      <>
                        <section className="content-section">
                          <div className="section-heading">
                            <div>
                              <h2>Folders</h2>
                              <p>{folders.length} folders</p>
                            </div>
                          </div>

                          {folders.length === 0 ? (
                              <div className="empty-state compact-empty">
                                <span className="empty-icon">📁</span>
                                <p>No folders here yet</p>
                                <small>Create a folder to organize your files.</small>
                              </div>
                          ) : (
                              <div className="folder-grid">
                                {folders.map((folder) => (
                                    <button
                                        key={folder.folderId}
                                        className="folder-card"
                                        onClick={() => openFolder(folder)}
                                    >
                                      <div className="folder-card-top">
                                        <span className="folder-visual">📁</span>
                                        <span className="card-menu">···</span>
                                      </div>

                                      <strong>{folder.folderName}</strong>
                                      <small>Folder</small>
                                    </button>
                                ))}
                              </div>
                          )}
                        </section>

                        <section className="content-section files-section">
                          <div className="section-heading">
                            <div>
                              <h2>Files</h2>
                              <p>{files.length} files</p>
                            </div>
                          </div>

                          {files.length === 0 ? (
                              <div className="empty-state">
                                <span className="empty-icon">📄</span>
                                <p>No files here yet</p>
                                <small>Upload a file to see it here.</small>
                              </div>
                          ) : (
                              <div className="file-grid">
                                {files.map((file) => {
                                  const fileId = file.fileId || file.id;

                                  return (
                                      <div
                                          className="file-card"
                                          key={fileId}
                                          role="button"
                                          tabIndex={0}
                                          onClick={() => downloadFile(fileId)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                              e.preventDefault();
                                              downloadFile(fileId);
                                            }
                                          }}
                                      >
                                        <div className="file-preview">
                                          <span>{getFileIcon(file.fileName)}</span>
                                        </div>

                                        <div className="file-info">
                                          <strong title={file.fileName}>
                                            {file.fileName}
                                          </strong>
                                          <small>File · Click to open</small>
                                        </div>

                                        <button
                                            type="button"
                                            className="star-button"
                                            title={
                                              file.isStarred
                                                  ? "Remove from Starred"
                                                  : "Add to Starred"
                                            }
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleStar(file);
                                            }}
                                        >
                                          {file.isStarred ? "★" : "☆"}
                                        </button>
                                      </div>
                                  );
                                })}
                              </div>
                          )}
                        </section>
                      </>
                  )}

                  {/* Recent view */}
                  {activeView === "recent" && (
                      <section className="content-section">
                        <div className="section-heading">
                          <div>
                            <h2>Recently opened</h2>
                            <p>{recentItems.length} items</p>
                          </div>

                          <button
                              className="secondary-button"
                              type="button"
                              onClick={openRecent}
                          >
                            ↻ Refresh
                          </button>
                        </div>

                        {recentItems.length === 0 ? (
                            <div className="empty-state">
                              <span className="empty-icon">◷</span>
                              <p>No recent activity yet</p>
                              <small>
                                Files and folders you open will appear here.
                              </small>
                            </div>
                        ) : (
                            <div className="file-grid">
                              {recentItems.map((item) => (
                                  <div
                                      className="file-card"
                                      key={`${item.itemType}-${item.itemId}`}
                                      role="button"
                                      tabIndex={0}
                                      onClick={() => openRecentItem(item)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                          e.preventDefault();
                                          openRecentItem(item);
                                        }
                                      }}
                                  >
                                    <div className="file-preview">
                            <span>
                              {item.itemType === "FOLDER"
                                  ? "📁"
                                  : getFileIcon(item.itemName)}
                            </span>
                                    </div>

                                    <div className="file-info">
                                      <strong title={item.itemName}>
                                        {item.itemName}
                                      </strong>

                                      <small>
                                        {item.itemType} ·{" "}
                                        {item.lastOpenedAt
                                            ? new Date(item.lastOpenedAt).toLocaleString()
                                            : "Recently opened"}
                                      </small>
                                    </div>
                                  </div>
                              ))}
                            </div>
                        )}
                      </section>
                  )}

                  {/* Starred view */}
                  {activeView === "starred" && (
                      <section className="content-section">
                        <div className="section-heading">
                          <div>
                            <h2>Starred Files</h2>
                            <p>{starredFiles.length} files</p>
                          </div>

                          <button
                              className="secondary-button"
                              type="button"
                              onClick={openStarred}
                          >
                            ↻ Refresh
                          </button>
                        </div>

                        {starredFiles.length === 0 ? (
                            <div className="empty-state">
                              <span className="empty-icon">☆</span>
                              <p>No starred files yet</p>
                              <small>
                                Star important files to access them quickly.
                              </small>
                            </div>
                        ) : (
                            <div className="file-grid">
                              {starredFiles.map((file) => {
                                const fileId = file.fileId || file.id;

                                return (
                                    <div
                                        className="file-card"
                                        key={fileId}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => downloadFile(fileId)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            downloadFile(fileId);
                                          }
                                        }}
                                    >
                                      <div className="file-preview">
                                        <span>{getFileIcon(file.fileName)}</span>
                                      </div>

                                      <div className="file-info">
                                        <strong title={file.fileName}>
                                          {file.fileName}
                                        </strong>
                                        <small>Starred File · Click to open</small>
                                      </div>

                                      <button
                                          type="button"
                                          className="star-button"
                                          title="Remove from Starred"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleStar(file);
                                          }}
                                      >
                                        ★
                                      </button>
                                    </div>
                                );
                              })}
                            </div>
                        )}
                      </section>
                  )}
                </>
            )}

            <footer className="dashboard-footer">
              <span>CloudVault</span>
              <span>Your files. Your space.</span>
            </footer>

          </section>
        </main>
      </div>
  );
}

export default Dashboard;
