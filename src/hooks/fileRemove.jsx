import useStore from "../stores";

const useFileRemove = () => {
  const { path, setPath } = useStore();

  const handleFileRemove = (target) => {
    let copy = [...path];
    copy.find((p) => p.path === target.path).status = false;
    if (copy.some((p) => p.status)) {
      setPath(copy);
    } else {
      setPath([]);
    }
    console.log(path);
  };
  return { handleFileRemove };
};

export default useFileRemove;
