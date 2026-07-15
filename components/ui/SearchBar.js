export default function SearchBar() {
  return (
    <form className="searchBar">
      <input
        type="search"
        placeholder="Buscar produto, categoria ou desejo..."
      />
      <button type="submit">Buscar</button>
    </form>
  );
}