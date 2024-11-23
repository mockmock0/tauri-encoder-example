import "../css/titlebar.css";
import { useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import MinimizeIcon from "@mui/icons-material/Minimize";
import CloseIcon from "@mui/icons-material/Close";
import { Button } from "@mui/material";

const Titlebar = () => {
  const appWindow = getCurrentWindow();

  const [closeHover, setCloseHover] = useState(false);
  const [minimizeHover, setMinimizeHover] = useState(false);
  const [maximizeHover, setMaximizeHover] = useState(false);
  return (
    <div className="titlebar">
      <div className="titlebar-drag-region">
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
