import dotenv from "dotenv";
dotenv.config();

(async () => {
  const { default: app } = await import("./app.js");
  const { default: connectDB } = await import("./config/db.js");

  const PORT = process.env.PORT || 5000;

  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Server startup failed:", error.message);
    });
})();
