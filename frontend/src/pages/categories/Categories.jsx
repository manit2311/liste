import React, { useState, useEffect } from 'react';
import { categoryAPI } from "../../api/categories";
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/StatusBadge';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';

export function Categories() {
  const [categories,setCategories]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [showAdd,setShowAdd]=useState(false);
  const [showEdit,setShowEdit]=useState(null);
  const [showDelete,setShowDelete]=useState(null);

  const [form,setForm]=useState({
      name:"",
      description:""
  });

useEffect(()=>{
    loadCategories();
},[]);

const loadCategories=async()=>{
    try{
        const response=await categoryAPI.getAll();
        setCategories(response.data.results);
    }catch(error){
        console.log(error);
        
    }finally{
        setLoading(false);
    }
};

const filtered=categories.filter(c=>
    c.name.toLowerCase().includes(search.toLowerCase())
);

const handleAddCategory=async()=>{
    try{
        await categoryAPI.create(form);

        setShowAdd(false);

        setForm({
            name:"",
            description:""
        });

        loadCategories();
    }catch(error){
        console.log(error);
    }
};

const handleEdit=async()=>{
    try{
        await categoryAPI.update(showEdit.id,form);

        setShowEdit(null);

        loadCategories();
    }catch(error){
        console.log(error);
    }
};

const handleDelete=async()=>{
    try{
        await categoryAPI.delete(showDelete.id);

        setShowDelete(null);

        loadCategories();
    }catch(error){
        console.log(error);
    }
};
if(loading){
    return <h2>Loading...</h2>;
}

  return (
    <div>
      <div className="page-intro">
        <div>
          <h1>Categories</h1>
          <p>Organize products into groups for easier management.</p>
        </div>
        <button className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6 }} onClick={() => setShowAdd(true)}><FiPlus /> Add category</button>      </div>
        <div className="toolbar">
        <div className="search-wrap" style={{ maxWidth: 300 }}>
          <span className="search-icon"><FiSearch /></span>
          <input
            className="search-input"
            placeholder="Search category..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Products</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><span className="tag">{c.id}</span></td>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: "#a87c9e", fontSize: 13 }}>{c.description}</td>
                  <td>
                      <span className="badge badge-pink">
                          {c.product_count}
                      </span>
                  </td>
                  <td><StatusBadge status={c.product_count > 0 ? "active" : "inactive"} /></td>
                  <td>
                    <div className="actions-cell">
                    <button className="action-btn" onClick={() => {
                        setForm({
                          name: c.name,
                          description: c.description
                        });
                        setShowEdit(c);
                      }}>
                        <FiEdit2 />
                      </button>
                      <button className="action-btn danger" onClick={() => setShowDelete(c)}>
                        <FiTrash2 />
                      </button>
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
          title="Add category" 
          onClose={() => setShowAdd(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleAddCategory}
          >
            Save
          </button></>}
        >
          <div className="form-group">
            <label className="form-label">Category name</label>
            <input className="input-field"     value={form.name}
            onChange={(e)=>setForm({...form,name:e.target.value})}
  />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="input-field"
              value={form.description}
              onChange={(e)=>setForm({...form,description:e.target.value})}
            />
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal
          title="Edit Category"
          onClose={() => setShowEdit(null)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowEdit(null)}
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={handleEdit}
              >
                Save Changes
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              className="input-field"
              value={form.name}
              onChange={(e)=>setForm({...form,name:e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="input-field"
              value={form.description}
              onChange={(e)=>setForm({...form,description:e.target.value})}
            />
          </div>
        </Modal>
      )}

      {showDelete && (
        <Modal
          title="Delete Category"
          onClose={() => setShowDelete(null)}
          size="sm"
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowDelete(null)}
              >
                Cancel
              </button>

              <button
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Delete
              </button>
            </>
          }
        >
          <p>
            Are you sure you want to delete
            <strong> {showDelete.name}</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}