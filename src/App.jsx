import * as Main from "./components/main";
import Titlebar from "./components/titlebar";
import "./css/App.css";

function App() {
  return (
    <main className="container">
      <Titlebar />
      <Main.Main />
    </main>
  );
}

export default App;
