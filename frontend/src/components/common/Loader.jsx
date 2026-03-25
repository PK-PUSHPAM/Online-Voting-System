export default function Loader({ fullScreen = false, label = "Loading..." }) {
  return (
    <div className={fullScreen ? "loader-screen" : "loader-inline"}>
      <div className="loader-orbit" />
      <p className="loader-text">{label}</p>
    </div>
  );
}
