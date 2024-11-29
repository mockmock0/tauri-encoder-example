import { Button } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { open } from "@tauri-apps/plugin-dialog";
import useStore from "../stores";
import { Progress } from "./progress";
import { useFileAdd } from "../hooks/useFileAdd";

const InitPage = () => {
  const { path, isEncoding, setIsEncoding, rawMsg } = useStore();
  const { addFile, listIndex } = useFileAdd();
  return (
    <>
      <Progress />
      <div id="input-file-container">
        <div style={{ width: "100%" }}>
          <div style={{ width: "100%", display: "flex", flexDirection: "row", gap: "0.625rem" }}>
            <Button
              variant="contained"
              onClick={addFile}
              color="primary"
              style={{
                fontSize: "1.1rem",
                borderRadius: "1rem",
                width: "100%",
                padding: path.some((p) => p.status) ? "0" : "1rem 1.5rem",
                margin: "0 1rem",
                opacity: path.some((p) => p.status) ? "0" : "1",
                overflow: "hidden",
                transition: "all 0.3s ease-out",
                transitionProperty: "opacity, max-width, min-width, padding, margin",
              }}
              disabled={path.some((p) => p.status) ? true : false}
            >
              Select File
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export { InitPage };
