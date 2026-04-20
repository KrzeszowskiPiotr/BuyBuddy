import { useEffect, useState } from "react";
import axios from "axios";

function App() {
    const [items, setItems] = useState<string[]>([]);
    const [text, setText] = useState("");

    const load = () => {
        axios.get("http://localhost:3000/items")
            .then(res => setItems(res.data));
    };

    const add = () => {
        axios.post("http://localhost:3000/items", { name: text })
            .then(() => load());
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <div>
            <h1>Lista zakupów</h1>

            <input onChange={e => setText(e.target.value)} />
            <button onClick={add}>Dodaj</button>

            {items.map((i, idx) => (
                <div key={idx}>{i}</div>
            ))}
        </div>
    );
}

export default App;