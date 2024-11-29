const LoadPage = (props) => {
  return (
    <>
      <div
        style={{
          position: "absolute",
          padding: 0,
          margin: 0,
          display: "flex",
          flex: "1 1 0",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: "100000",
          backdropFilter: "blur(10px)",
        }}
      >
        {props.msg}
      </div>
    </>
  );
};

export default LoadPage;
