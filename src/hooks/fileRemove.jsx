import useStore from "../stores";

const useFileRemove = () => {
  const { path, setPath } = useStore();

  const handleRemove = (target) => {
    let copy = [...path];
    copy = copy.filter((p) => p !== target);
    setPath(copy);
  };
  return { handleRemove };
};

export default useFileRemove;
