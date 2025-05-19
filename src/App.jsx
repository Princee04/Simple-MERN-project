import TableMaterial from "../components/tableMaterial";
import ErrorBoundary from "../ErrorBoundary";

function App() {
  return (
    <>
      <ErrorBoundary>
        <TableMaterial />
      </ErrorBoundary>
    </>
  );
}

export default App;
