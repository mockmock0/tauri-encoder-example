import "../css/titlebar.css";
import { useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import MinimizeIcon from "@mui/icons-material/Minimize";
import CloseIcon from "@mui/icons-material/Close";
import { Button } from "@mui/material";
import { motion } from "framer-motion";
import useStore from "../stores";

const Titlebar = () => {
  const appWindow = getCurrentWindow();
  const { path, setPath, isEncoding } = useStore();
  const [closeHover, setCloseHover] = useState(false);
  const [minimizeHover, setMinimizeHover] = useState(false);
  const [maximizeHover, setMaximizeHover] = useState(false);
  return (
    <div className="titlebar">
      <div className="titlebar-drag-region">
        {path.length >= 2 && !isEncoding ? (
          <div className="titlebar-title-container" style={{ display: "flex", width: "100%", height: "35px" }}>
            <div
              className="window-title titlebar-side-space"
              style={{
                height: "100%",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                appWindow.startDragging();
              }}
            ></div>
            <motion.div
              key="titlebar-toggle-button"
              className="titlebar-toggle-button"
              style={{
                width: "fit-content",
                height: "35px",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                zIndex: "1",
                flexGrow: "0",
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.1,
                ease: [0, 0.71, 0.2, 1.01],
              }}
            >
              <Button
                size="small"
                variant="contained"
                sx={{
                  height: "1.5rem",
                  fontSize: ".8rem",
                  backgroundColor: "#ef5350",
                  zIndex: "1",
                  borderRadius: "1rem",
                  flexGrow: "0",
                }}
                onClick={() => {
                  setPath([]);
                }}
              >
                Clear
              </Button>
            </motion.div>
            <div
              className="titlebar-toggle-button"
              style={{
                width: "fit-content",
                height: "100%",
                lineHeight: "2rem",
                flexWrap: "wrap",
                flexGrow: "1",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                appWindow.startDragging();
              }}
            ></div>
          </div>
        ) : (
          <>
            <div
              className="window-title"
              style={{
                width: "100%",
                height: "100%",
                lineHeight: "2rem",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                appWindow.startDragging();
              }}
            ></div>
          </>
        )}
        <div className="window-controls">
          <Button
            className="window-control minimize"
            style={{
              borderRadius: "0",
              color: minimizeHover ? "#ffffff" : "#828282",
            }}
            sx={{ minWidth: 0, padding: ".375rem 1rem" }}
            onClick={() => appWindow.minimize()}
            onMouseEnter={() => setMinimizeHover(true)}
            onMouseLeave={() => setMinimizeHover(false)}
          >
            <MinimizeIcon sx={{ fontSize: "1.2rem" }} />
          </Button>
          <Button
            className="window-control maximize"
            style={{
              borderRadius: "0",
              color: maximizeHover ? "#ffffff" : "#828282",
            }}
            sx={{ minWidth: 0, padding: ".375rem 1rem" }}
            onClick={() => appWindow.maximize()}
            onMouseEnter={() => setMaximizeHover(true)}
            onMouseLeave={() => setMaximizeHover(false)}
          >
            <CropSquareIcon sx={{ fontSize: "1.2rem" }} />
          </Button>
          <Button
            className="window-control close"
            style={{
              borderRadius: "0",
              color: closeHover ? "#ffffff" : "#828282",
            }}
            sx={{ minWidth: 0, padding: ".375rem 1rem" }}
            onClick={() => appWindow.close()}
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
          >
            <CloseIcon sx={{ fontSize: "1.2rem" }} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Titlebar;
