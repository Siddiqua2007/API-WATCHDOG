import { useState } from "react";
import api from "../api/axios.js";

const AddEndpointForm = ({ onCreated }) => {
  const [form, setForm] = useState({
    name: "",
    url: "",
    method: "GET",
    expectedStatus: 200,
    intervalMins: 5,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.post("/endpoints", {
        ...form,
        expectedStatus: Number(form.expectedStatus),
        intervalMins: Number(form.intervalMins),
      });
      setForm({ name: "", url: "", method: "GET", expectedStatus: 200, intervalMins: 5 });
      onCreated?.();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create endpoint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
      <div>
        <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "4px" }}>Name</label>
        <input name="name" value={form.name} onChange={handleChange} required placeholder="My API" />
      </div>
      <div>
        <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "4px" }}>URL</label>
        <input
          name="url"
          value={form.url}
          onChange={handleChange}
          required
          placeholder="https://example.com/health"
          style={{ width: "260px" }}
        />
      </div>
      <div>
        <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "4px" }}>Method</label>
        <select name="method" value={form.method} onChange={handleChange}>
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>PATCH</option>
          <option>DELETE</option>
        </select>
      </div>
      <div>
        <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "4px" }}>Expected status</label>
        <input
          name="expectedStatus"
          type="number"
          value={form.expectedStatus}
          onChange={handleChange}
          style={{ width: "80px" }}
        />
      </div>
      <div>
        <label style={{ display: "block", fontSize: "0.8rem", marginBottom: "4px" }}>Interval (mins)</label>
        <input
          name="intervalMins"
          type="number"
          value={form.intervalMins}
          onChange={handleChange}
          style={{ width: "80px" }}
        />
      </div>
      <button type="submit" disabled={submitting}>
        {submitting ? "Adding..." : "Add endpoint"}
      </button>
      {error && <p style={{ color: "#a82f2f", width: "100%", margin: 0 }}>{error}</p>}
    </form>
  );
};

export default AddEndpointForm;
