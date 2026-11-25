import { useEffect, useState } from "react";
import "./Dashboard.css";
import { apiRequest } from "./services/api";
import CloudFileList from "./CloudFileList";
import Trash from "./Trash";
import "./css/CloudFileList.css";

function Dashboard() {
  const [rootId, setRootId] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState("");
  const [currentFolderName, setCurrentFolderName] = useState("home");

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [folderName, setFolderName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("my-files");

  async function loadContents(id) {
    const data = await apiRequest(`/folders/${id}/contents`);

    setFolders(data.folders || []);
    setFiles(data.files || []);
  }

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

  async function openFolder(folder) {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await loadContents(folder.folderId);

      setCurrentFolderId(folder.folderId);
      setCurrentFolderName(folder.folderName);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function goToRoot() {
    if (!rootId) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await loadContents(rootId);

      setCurrentFolderId(rootId);
      setCurrentFolderName("home");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
      setSuccess("File uploaded successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
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
                  className={`nav-item ${activeTab === "my-files" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("my-files");
                    goToRoot();
                  }}
              >
                <span className="nav-icon">▦</span>
                <span>My Files</span>
              </button>

              <button
                  className={`nav-item ${activeTab === "recent" ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveTab("recent")}
              >
                <span className="nav-icon">◷</span>
                <span>Recent</span>
              </button>

              <button
                  className={`nav-item ${activeTab === "starred" ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveTab("starred")}
              >
                <span className="nav-icon">☆</span>
                <span>Starred</span>
              </button>

              <button
                  className={`nav-item ${activeTab === "trash" ? "active" : ""}`}
                  type="button"
                  onClick={() => setActiveTab("trash")}
              >
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

          {/* Conditional content */}
          {activeTab === "trash" ? (

              <Trash/>

          ) : activeTab === "my-files" ? (

              <section className="dashboard-content">

                <div className="welcome-section">
                  <div>
                    <p className="eyebrow">YOUR WORKSPACE</p>
                    <h1>{currentFolderName}</h1>
                    <p className="welcome-description">
                      Manage your files and folders in one place.
                    </p>
                  </div>

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
                </div>

                <div className="breadcrumb">
                  <button onClick={goToRoot}>My Files</button>
                  <span className="breadcrumb-separator">/</span>
                  <strong>{currentFolderName}</strong>
                </div>

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

                {showForm && (
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
                              <CloudFileList
                                  files={files}
                                  onFileDeleted={(fileId) => {
                                    setFiles((prevFiles) =>
                                        prevFiles.filter(
                                            (file) => file.fileId !== fileId
                                        )
                                    );
                                    setSuccess("File moved to Trash successfully");
                                  }}
                              />
                            </div>
                        )}
                      </section>
                    </>
                )}

                <footer className="dashboard-footer">
                  <span>CloudVault</span>
                  <span>Your files. Your space.</span>
                </footer>

              </section>

          ) : activeTab === "recent" ? (

              <section className="dashboard-content">
                <h1>Recent Files</h1>
                <p>Your recently accessed files will appear here.</p>
              </section>

          ) : activeTab === "starred" ? (

              <section className="dashboard-content">
                <h1>Starred Files</h1>
                <p>Your starred files will appear here.</p>
              </section>

          ) : null}

        </main>
      </div>
  );
}

export default Dashboard;