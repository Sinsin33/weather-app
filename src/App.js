import { useEffect, useState } from "react";

export default function App() {
  const [selectedCity, setSelectedCity] = useState("");
  const apiKey = "ba608fc197984b34b4a175138253008";
  const apiadd =
    "https://api.geoapify.com/v1/geocode/autocomplete?text=Mosc&apiKey=ca4aa98b402f451aa2a2aec1a218b009";

  const handleSelectCity = function (cityName) {
    setSelectedCity(() => cityName);
  };
  return (
    <>
      <header>
        <Search onSelectCity={handleSelectCity} />
      </header>
      <Main selectedCity={selectedCity} />
    </>
  );
}
function Search({ onSelectCity }) {
  const [query, setQuery] = useState("");

  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&types=city&apiKey=ca4aa98b402f451aa2a2aec1a218b009`
        );
        const data = await res.json();
        setResults(data.features || []);
      } catch (err) {
        console.error(err);
      }
    }, 300); // wait 300ms

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="search">
      <div className="search-bar">
        <input
          className="search-bar__input"
          placeholder="type name of city"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <button className="search-bar__btn">search</button>
      </div>
      <div className="toolBarContainer">
        <SearchBar results={results} onSelectCity={onSelectCity} />
      </div>
    </div>
  );
}

function SearchBar({ results, onSelectCity }) {
  return (
    <ul className="results-list">
      {results.map((item) => (
        <li
          key={item.properties.place_id}
          onClick={() => onSelectCity(item.properties.city)}
        >
          {item.properties.formatted}
        </li>
      ))}
    </ul>
  );
}
function Main({ selectedCity }) {
  return <h1>{selectedCity}</h1>;
}
