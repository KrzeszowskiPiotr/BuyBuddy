import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

import "./App.scss";

const socket = io("http://localhost:3000");

function App() {
    const [view, setView] = useState("home");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [user, setUser] = useState<any>(null);

    const [message, setMessage] = useState("");

    const [lists, setLists] = useState<any[]>([]);
    const [selectedList, setSelectedList] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);

    const [listName, setListName] = useState("");
    const [itemName, setItemName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");

    const headers = {
        Authorization: token
    };

    useEffect(() => {
        if (selectedList) {
            document.body.classList.add("list-selected");
        } else {
            document.body.classList.remove("list-selected");
        }
    }, [selectedList]);

    // ================= AUTH =================

    const register = () => {
        axios.post("http://localhost:3000/auth/register", {
            name,
            email,
            password
        })
            .then(() => {
                setMessage("Account created");
                setView("home");
            })
            .catch(err => setMessage(err.response?.data));
    };

    const login = () => {
        axios.post("http://localhost:3000/auth/login", {
            email,
            password
        })
            .then(res => {
                setToken(res.data.user._id);
                setUser(res.data.user);

                localStorage.setItem("token", res.data.token);

                socket.emit("join-user", res.data.user._id);

                setView("app");
            })
            .catch(err => setMessage(err.response?.data));
    };

    const logout = () => {
        localStorage.clear();
        setToken("");
        setUser(null);
        setView("home");
    };

    // ================= LISTS =================

    const loadLists = () => {
        axios.get("http://localhost:3000/lists", { headers })
            .then(res => setLists(res.data));
    };

    const createList = () => {
        axios.post("http://localhost:3000/lists",
            { name: listName },
            { headers }
        ).then(() => {
            setListName("");
            loadLists();
        });
    };

    const selectList = (list: any) => {
        setSelectedList(list);

        socket.emit("join-list", list._id);

        axios.get(`http://localhost:3000/items/${list._id}`, { headers })
            .then(res => setItems(res.data));
    };

    const deleteList = (id: string) => {
        axios.delete(`http://localhost:3000/lists/${id}`, { headers })
            .then(() => {
                setLists(prev => prev.filter(l => l._id !== id));
                setSelectedList(null);
                setItems([]);
            });
    };

    const addUserToList = () => {
        axios.post(
            `http://localhost:3000/lists/${selectedList._id}/add-user`,
            { userEmail: inviteEmail },
            { headers }
        ).then(() => setInviteEmail(""));
    };

    // ================= ITEMS =================

    const addItem = () => {
        axios.post("http://localhost:3000/items",
            { name: itemName, listId: selectedList._id },
            { headers }
        ).then(() => setItemName(""));
    };

    const deleteItem = (id: string) => {
        axios.delete(`http://localhost:3000/items/${id}`, { headers })
            .then(() => setItems(prev => prev.filter(i => i._id !== id)));
    };

    // ================= SOCKET =================

    useEffect(() => {
        socket.on("new-item", (item) => {
            setItems(prev => [...prev, item]);
        });

        // 🔥 DODANE (KLUCZ DO TWOJEGO PROBLEMU)
        socket.on("new-list", (list) => {
            setLists(prev => {
                const exists = prev.find(l => l._id === list._id);
                if (exists) return prev;
                return [...prev, list];
            });
        });

        return () => {
            socket.off("new-item");
            socket.off("new-list");
        };
    }, []);

    useEffect(() => {
        if (token) loadLists();
    }, [token]);

    // ================= UI =================

    if (view === "home") {
        return (
            <div className="auth-center">
                <h1 className="logo">BuyBuddy</h1>

                <div className="auth-box">
                    <button onClick={() => setView("login")}>Login</button>
                    <button className="secondary" onClick={() => setView("register")}>Register</button>
                </div>

                <p>{message}</p>
            </div>
        );
    }

    if (view === "login") {
        return (
            <div className="auth-center">
                <h1 className="logo">BuyBuddy</h1>

                <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
                <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />

                <button onClick={login}>Login</button>
                <button className="secondary" onClick={() => setView("home")}>Back</button>

                <p>{message}</p>
            </div>
        );
    }

    if (view === "register") {
        return (
            <div className="auth-center">
                <h1 className="logo">BuyBuddy</h1>

                <input placeholder="Name" onChange={e => setName(e.target.value)} />
                <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
                <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />

                <button onClick={register}>Create</button>
                <button className="secondary" onClick={() => setView("home")}>Back</button>

                <p>{message}</p>
            </div>
        );
    }

    return (
        <div className="app">

            <h1 className="logo-header">BuyBuddy</h1>

            <div className="topbar">
                <div className="topbar-left">
                    Logged as <b>{user?.name}</b>
                </div>

                <button onClick={logout}>Logout</button>
            </div>

            <div className="layout">

                <div className="panel left">
                    <h3>Lists</h3>

                    <input
                        placeholder="new list"
                        onChange={e => setListName(e.target.value)}
                    />

                    <button onClick={createList}>Create</button>

                    {lists.map(l => (
                        <div
                            key={l._id}
                            className={`item ${selectedList?._id === l._id ? "active" : ""}`}
                            onClick={() => selectList(l)}
                        >
                            <span>{l.name}</span>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteList(l._id);
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                <div className="panel center">
                    {selectedList ? (
                        <>
                            <h3>Items</h3>

                            <input
                                placeholder="new item"
                                value={itemName}
                                onChange={e => setItemName(e.target.value)}
                            />

                            <button onClick={addItem}>Add</button>

                            {items.map(i => (
                                <div key={i._id} className="item">
                                    {i.name}
                                    <button onClick={() => deleteItem(i._id)}>✕</button>
                                </div>
                            ))}
                        </>
                    ) : (
                        <p>Select a list</p>
                    )}
                </div>

                <div className="panel right">
                    {selectedList && (
                        <>
                            <h3>Invite user</h3>

                            <input
                                placeholder="email"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                            />

                            <button onClick={addUserToList}>Invite</button>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}

export default App;