import { useState } from "react";

export default function Admin() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const addProcess = async () => {
    await fetch("http://localhost:5000/add-process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description })
    });

    alert("Process added");
    setTitle("");
    setDescription("");
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Add Process</h2>

      <input
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <br /><br />

      <textarea
        placeholder="Description"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      <br /><br />

      <button onClick={addProcess}>Save</button>
    </div>
  );
}
