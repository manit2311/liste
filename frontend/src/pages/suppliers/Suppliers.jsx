import { supplierAPI } from "../../api/suppliers";
import { useEffect, useState } from "react";
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

export function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [showDelete, setShowDelete] = useState(null);

  const [form,setForm]=useState({
      name:"",
      contact_person:"",
      country:"",
      phone:"",
      email:"",
      address:"",
      lead_days:7
  });

  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    loadSuppliers();
}, []);

const loadSuppliers = async () => {
    try {
        const response = await supplierAPI.getAll();
        setSuppliers(response.data.results);
    } catch (error) {
        console.log(error);
    } finally {
        setLoading(false);
    }
};

const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
);

const handleAddSupplier = async () => {
    try {
        await supplierAPI.create(form);

        setShowAdd(false);

        setForm({
          name: "",
          contact_person: "",
          country: "",
          phone: "",
          email: "",
          address: "",
          lead_days: 7
        });

        loadSuppliers();
    } catch (error) {
        console.log(error);
    }
};

const handleEdit = async () => {
    try {
        await supplierAPI.update(showEdit.id, form);

        setShowEdit(null);

        loadSuppliers();
    } catch (error) {
        console.log(error);
    }
};

const handleDelete = async () => {
  try {
    await supplierAPI.delete(showDelete.id);
    setShowDelete(null);
    setDeleteError("");
    loadSuppliers();
  } catch (error) {
    setDeleteError(error?.response?.data?.error || "Failed to delete supplier.");
  }
};

  return (
    <div>
      <div className="page-intro">
        <div>
          <h1>Suppliers</h1>
          <p>Manage your product source vendors and contacts.</p>
        </div>
        <button className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => {
          setForm({
            name: "",
            contact_person: "",
            country: "",
            phone: "",
            email: "",
            address: "",
            lead_days: 7
          });
          setShowAdd(true);
        }}><FiPlus /> Add supplier</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Country</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Products</th>
                <th>Lead time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 11.5, color: "#a87c9e" }}>{s.id}</div>
                  </td>
                  <td>{s.country}</td>
                  <td>{s.contact_person}</td>
                  <td style={{ fontSize: 12.5, color: "#a87c9e" }}>{s.email}</td>
                  <td style={{ fontSize: 12.5 }}>{s.phone}</td>
                  <td><span className="badge badge-pink">{s.product_count}</span></td>
                  <td>{s.lead_days}d</td>
                  <td><StatusBadge
                        status={s.product_count > 0 ? "active" : "inactive"}
                    /></td>
                  <td>
                    <div className="actions-cell">
                    <button className="action-btn" onClick={() => {
                        setForm(s);
                        setShowEdit(s);
                      }}><FiEdit2 /></button>
                      <button className="action-btn danger" onClick={() => setShowDelete(s)}><FiTrash2 /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <Modal 
          title="Add supplier" 
          onClose={() => setShowAdd(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAddSupplier}>Save supplier</button></>}
        >
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Company name</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e)=>setForm({...form,name:e.target.value})}
                />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <input
                className="input-field"
                value={form.country}
                onChange={(e)=>setForm({...form,country:e.target.value})}
                />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Contact person</label>
              <input
                className="input-field"
                value={form.contact_person}
                onChange={(e)=>setForm({...form,contact_person:e.target.value})}
                />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                className="input-field"
                value={form.phone}
                onChange={(e)=>setForm({...form,phone:e.target.value})}
                />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="input-field"
              type="email"
              value={form.email}
              onChange={(e)=>setForm({...form,email:e.target.value})}
              />
          </div>
          <div className="form-group">
            <label className="form-label">Lead time (days)</label>
            <input
              className="input-field"
              type="number"
              value={form.lead_days}
              onChange={(e)=>setForm({...form,lead_days:e.target.value})}
              />
          </div>
        </Modal>
      )}
  
{showEdit && (
  <Modal
    title="Edit supplier"
    onClose={() => setShowEdit(null)}
    footer={<>
      <button className="btn btn-secondary" onClick={() => setShowEdit(null)}>Cancel</button>
      <button className="btn btn-primary" onClick={handleEdit}>Save changes</button>
    </>}
  >
    <div className="grid-2">
      <div className="form-group">
        <label className="form-label">Company name</label>
        <input className="input-field" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} />
      </div>
      <div className="form-group">
        <label className="form-label">Country</label>
        <input className="input-field" value={form.country} onChange={(e)=>setForm({...form,country:e.target.value})} />
      </div>
    </div>
    <div className="grid-2">
      <div className="form-group">
        <label className="form-label">Contact person</label>
        <input className="input-field" value={form.contact_person} onChange={(e)=>setForm({...form,contact_person:e.target.value})} />
      </div>
      <div className="form-group">
        <label className="form-label">Phone</label>
        <input className="input-field" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})} />
      </div>
    </div>
    <div className="form-group">
      <label className="form-label">Email</label>
      <input className="input-field" type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} />
    </div>
    <div className="form-group">
      <label className="form-label">Lead time (days)</label>
      <input className="input-field" type="number" value={form.lead_days} onChange={(e)=>setForm({...form,lead_days:e.target.value})} />
    </div>
  </Modal>
)}

{showDelete && (
  <Modal
    title="Delete supplier"
    onClose={() => setShowDelete(null)}
    size="sm"
    footer={<>
      <button className="btn btn-secondary" onClick={() => setShowDelete(null)}>Cancel</button>
      <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
    </>}
  >
    <p style={{ fontSize: 14, color: "#4a2e42", lineHeight: 1.6 }}>
      Are you sure you want to delete <strong>{showDelete.name}</strong>? This action cannot be undone.
    </p>
  </Modal>
)}
    </div>
  );
}