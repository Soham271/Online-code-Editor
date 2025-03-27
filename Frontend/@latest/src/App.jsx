import React from "react";
import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./pages/Home";
import EditorPage from "./pages/EditorPage";
import { Toaster } from "react-hot-toast";

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/editor/:roomid",
      element: <EditorPage />,
    },
  ]);

  return (
    <>
      {/* ✅ Correct placement of Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            style: {
              background: "#4aed88",
              color: "#fff",
            },
          },
          error: {
            style: {
              background: "#ff4f4f",
              color: "#fff",
            },
          },
        }}
      />
      {/* Router to handle navigation */}
      <RouterProvider router={router} />
    </>
  );
};

export default App;
