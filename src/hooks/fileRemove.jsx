import useStore from "../stores";

const useFileRemove = () => {
  const { path, setPath, setVideoInfo } = useStore();

  const handleFileRemove = (target) => {
    let copy = [...path];
    copy.find((p) => p.path === target.path).status = false;
    if (copy.some((p) => p.status)) {
      setPath(copy);
    } else {
      setPath([]);
    }
    if (!path.some((item) => item.status)) {
      setVideoInfo([]);
      localStorage.removeItem("videoInfo");
    }
  };
  return { handleFileRemove };
};

export default useFileRemove;
