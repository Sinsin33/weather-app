import { useEffect, useRef, useState } from "react";

export default function App() {
  const [selectedCity, setSelectedCity] = useState("");
  useEffect(() => {
    // Try geolocation on first mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocode coords -> city name (using Geoapify)
            const res = await fetch(
              `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=ca4aa98b402f451aa2a2aec1a218b009`
            );
            const data = await res.json();
            const city =
              data.features[0]?.properties.city ||
              data.features[0]?.properties.formatted;
            if (city) setSelectedCity(city);
          } catch (err) {
            console.error("Error fetching reverse geocode:", err);
          }
        },
        (err) => {
          console.warn("Geolocation denied or unavailable:", err.message);
        }
      );
    }
  }, []);
  const handleSelectCity = (cityName) => {
    setSelectedCity(cityName);
  };

  return (
    <>
      <header>
        <Search onSelectCity={handleSelectCity} />
      </header>
      <main>
        <Main selectedCity={selectedCity} />
      </main>
    </>
  );
}

function Search({ onSelectCity }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // 🔹 Fetch cities
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
        setHighlightedIndex(-1);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 🔹 Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (cityName) => {
    onSelectCity(cityName);
    setQuery(cityName);
    setResults([]);
    setHighlightedIndex(-1);
    setIsOpen(false);
  };

  return (
    <div className="search" ref={wrapperRef}>
      <div className="search-bar">
        <input
          className="search-bar__input"
          placeholder="Type name of city"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightedIndex((prev) =>
                prev < results.length - 1 ? prev + 1 : 0
              );
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightedIndex((prev) =>
                prev > 0 ? prev - 1 : results.length - 1
              );
            }
            if (e.key === "Enter") {
              e.preventDefault();
              const selected =
                results[highlightedIndex] &&
                (results[highlightedIndex].properties.city ||
                  results[highlightedIndex].properties.formatted);
              if (selected) handleSelect(selected);
            }
          }}
        />
        <button
          className="search-bar__btn"
          onClick={() => query && handleSelect(query)}
        >
          Search
        </button>
      </div>

      {isOpen && results.length > 0 && (
        <SearchBar
          results={results}
          highlightedIndex={highlightedIndex}
          onSelectCity={handleSelect}
          onHover={(index) => setHighlightedIndex(index)}
        />
      )}
    </div>
  );
}

function SearchBar({ results, onSelectCity, onHover, highlightedIndex }) {
  return (
    <ul className="results-list">
      {results.map((item, i) => {
        const isHighlighted = i === highlightedIndex;
        return (
          <li
            key={item.properties.place_id}
            className={isHighlighted ? "highlighted" : ""}
            onClick={() =>
              onSelectCity(item.properties.city || item.properties.formatted)
            }
            onMouseEnter={() => onHover(i)}
          >
            {item.properties.formatted}
          </li>
        );
      })}
    </ul>
  );
}

function Main({ selectedCity }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!selectedCity) return;

    async function fetchWeather() {
      try {
        const res = await fetch(
          `http://api.weatherapi.com/v1/current.json?key=ba608fc197984b34b4a175138253008&q=${selectedCity}&aqi=no`
        );
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchWeather();
  }, [selectedCity]);

  if (!weather) {
    return (
      <div className="main">
        <span className="loader"></span>
      </div>
    );
  }

  return (
    <div className="main">
      <h1>{selectedCity}</h1>
      <p>Temperature: {weather.current.temp_c}°C</p>
      <p>Condition: {weather.current.condition.text}</p>
      <img src={weather.current.condition.icon} alt="weather icon" />
    </div>
  );
}
