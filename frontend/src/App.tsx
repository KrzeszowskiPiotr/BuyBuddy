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

    const [loginMessage, setLoginMessage] = useState("");
    const [registerMessage, setRegisterMessage] = useState("");

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
                alert("Account created");

                setName("");
                setEmail("");
                setPassword("");

                setRegisterMessage("");
                setLoginMessage("");

                setView("home");
            })
            .catch(err => setRegisterMessage(err.response?.data));
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

                setName("");
                setEmail("");
                setPassword("");

                setLoginMessage("");
                setRegisterMessage("");

                setView("app");
            })
            .catch(err => {
                setLoginMessage(err.response?.data)
            });
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
        )
            .then(() => {
                setListName("");
                loadLists();
            })
            .catch(err => {
                alert(err.response?.data);
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
        )
            .then(() => {
                setInviteEmail("");
            })
            .catch(err => {
                alert(err.response?.data || "Error");
            });
    };

    // ================= ITEMS =================

    const addItem = () => {
        axios.post("http://localhost:3000/items",
            { name: itemName, listId: selectedList._id },
            { headers }
        ).then(() => {
            setItemName("")
        }).catch(err => {
            alert(err.response?.data);
        });
    };

    const deleteItem = (id: string) => {
        axios.delete(`http://localhost:3000/items/${id}`, { headers })
            .then(() => setItems(prev => prev.filter(i => i._id !== id)));
    };
    const crossItem=(id:string) => {
        const item=document.getElementById(`item-${id}`);
        if(!item) return;
        if(item.style.textDecoration === "line-through"){
            item.style.textDecoration = "none";
        }
        else{
            item.style.textDecoration = "line-through";
        }
    }
    // ================= SOCKET =================

    useEffect(() => {
        socket.on("new-item", (item) => {
            setItems(prev => [...prev, item]);
        });

        socket.on("new-list", (list) => {
            setLists(prev => {
                const exists = prev.find(l => l._id === list._id);
                if (exists) return prev;
                return [...prev, list];
            });
        });

        socket.on("delete-item", (itemId) => {
            setItems(prev => prev.filter(i => i._id !== itemId));
        });

        return () => {
            socket.off("new-item");
            socket.off("new-list");
            socket.off("delete-item");
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
                    <h2>Plan, share and manage your groceries together</h2>
                    <h3>Fast, simple shopping lists for everyday use</h3>
                    <button className="login" onClick={() => setView("login")}>Login</button>
                    <button className="register" onClick={() => setView("register")}>Register</button>
                </div>
            </div>
        );
    }

    if (view === "login") {
        return (
            <div className="auth-center">
                <h1 className="logo">BuyBuddy</h1>
                <div className="login-register-box">
                    <h3>Login</h3>
                    <input placeholder="Email" required onChange={e => setEmail(e.target.value)} />
                    <input placeholder="Password" type="password" required onChange={e => setPassword(e.target.value)} />
                    <button onClick={login} className="login">Login</button>
                    <button className="register" onClick={() => {
                        setLoginMessage("");
                        setRegisterMessage("");
                        setView("home");
                    }}
                >Back</button>
                    <p>Don't have an account? <span onClick={() => setView("register")} style={{ cursor: "pointer", color: "blue" }}>Sign up</span></p>
                <p className="login-register-error">{loginMessage}</p>
            </div>
            </div>
        );
    }

    if (view === "register") {
        return (
            <div className="auth-center">
                <h1 className="logo">BuyBuddy</h1>
                <div className="login-register-box">
                    <h3>Register</h3>
                    <input placeholder="Name" className="form" onChange={e => setName(e.target.value)}/>
                    <input placeholder="E-mail" className="form" required onChange={e => setEmail(e.target.value)}/>
                    <input placeholder="Password" className="form" type="password" onChange={e => setPassword(e.target.value)}/>
                    <button onClick={register} className="login">Create</button>
                    <button
                    className="register"
                    onClick={() => {
                        setLoginMessage("");
                        setRegisterMessage("");
                        setView("home");
                    }}
                    >Back</button>
                    <p>Already have an account? <span onClick={() => setView("login")} style={{ cursor: "pointer", color: "blue" }}>Log in</span></p>
                    <p className="login-register-error">{registerMessage}</p>
                </div>
            </div>
        );
    }
    return (
        <div className="main">
            <section>
                <h1>BuyBuddy</h1>
                <p>Logged as <b>{user?.name}</b></p>
                <button onClick={logout} className="logout">Logout</button>
            </section>

            <aside>
                <div className="creating-list">
                    <input type="text" placeholder="New list name" value={listName} onChange={e => setListName(e.target.value)} />
                    <button onClick={createList}>Create List</button>
                </div>
                <div className="lists-display">
                    {lists.map((list) => {
                        const isOpen = selectedList?._id === list._id;

                        return (
                            <div key={list._id} className="list-card">

                                <div
                                    className="list-header"
                                    onClick={() => selectList(list)}
                                >
                                    <div className="name-owner">
                                        <span>{list.name}</span><br/>
                                        <small> owner: {list.owner?.name}</small>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteList(list._id);
                                        }}
                                    >✕</button>
                                </div>
                                {isOpen && (
                                    <div>
                                        <div className="items">

                                            <input
                                                type="text"
                                                placeholder="New item name"
                                                value={itemName}
                                                onChange={(e) => setItemName(e.target.value)}
                                            />

                                            <button onClick={addItem} className="additem-button">Add</button>

                                        </div>

                                        {items.map((item) => (
                                            <div key={item._id} className="item">
                                                <span id={`item-${item._id}`}>{item.name}</span>
                                                <button onClick={() => deleteItem(item._id)} className="deletebutton">x</button>
                                                <button onClick={()=>crossItem(item._id)}>v</button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                            </div>
                        );
                    })}
                </div>
            </aside>
        </div>

    );
}

export default App;